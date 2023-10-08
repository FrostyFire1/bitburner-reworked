import { NS } from "@ns";
import {getServerList, batchPotential, isPrepped, prepServer, movePayload} from "/rework/lib";
let STEAL_PERCENTAGE = 0.5;
const DIR = 'scripts/payload/';

export async function main(ns: NS) {
    ns.disableLog('ALL'); ns.clearLog(); ns.tail();

    movePayload(ns, ns.ls("home","scripts/payload"));
    const targetable = getServerList(ns)
    .sort((a,b) => {return batchPotential(ns, b) - batchPotential(ns, a);})
    .filter(hostname => ns.hasRootAccess(hostname));
    // let toPrep = targetable.filter(s => !isPrepped(ns, s));
    // for(const hostname of toPrep){
    //     await prepServer(ns, hostname);
    // }
    //const target = targetable.filter(s => isPrepped(ns,s))[0];
    const target = "n00dles";
    const batchInfo = simulateBatch(ns, target);

    if(hasEnoughThreads(ns, target, batchInfo)) batchServer(ns, target);

}

function simulateBatch(ns: NS, server: string){
    const f = ns.formulas;
    const SEC_DEC = ns.weakenAnalyze(1,1);
    let sim = ns.getServer(server);
    const player = ns.getPlayer();
    sim.hackDifficulty = sim.minDifficulty;
    sim.moneyAvailable = sim.moneyMax;

    const hp = f.hacking.hackPercent(sim, player);
    const hThreads = Math.ceil(STEAL_PERCENTAGE / hp);
    sim.moneyAvailable = sim.moneyMax * STEAL_PERCENTAGE;
    sim.hackDifficulty += Math.min(ns.hackAnalyzeSecurity(hThreads,server), 100-sim.hackDifficulty);

    const gThreads = f.hacking.growThreads(sim, player, sim.moneyMax);
    sim.hackDifficulty += Math.min(ns.growthAnalyzeSecurity(gThreads, server,1),100-sim.hackDifficulty);

    const wThreads = Math.ceil((sim.hackDifficulty - sim.minDifficulty) / SEC_DEC);

    return {
        hThreads: [hThreads,DIR+'hack.js'],
        gThreads: [gThreads,DIR+'grow.js'],
        wThreads: [wThreads, DIR+'weaken.js'],
    };
}

function hasEnoughThreads(ns: NS, target: string, batchInfo: object){
    let usableServers = [...getServerList(ns), ...ns.getPurchasedServers()]
    .map(s=>ns.getServer(s))
    .filter(s => s.maxRam > 0 && s.hasAdminRights);

    for(let [threads, script] of Object.values(batchInfo)){
        const scriptRam = ns.getScriptRam(script);
        for(let i = 0; i < usableServers.length; i++){
            const server = usableServers[i];
            let ram = server.maxRam - server.ramUsed;
            let sThreads = Math.min(threads, Math.floor(ram / scriptRam));
            threads -= sThreads;
            server.ramUsed += sThreads*scriptRam;
            if(server.maxRam - server.ramUsed < scriptRam){
                usableServers.splice(i,1);
                i--;
            }
            if(threads === 0) break;
        }
    }

    const threadsLeft = Object.values(batchInfo)
    .map(a=>a[0])
    .reduce((a,b) => {return a+b},0);
    return threadsLeft > 0;
    
}

function batchServer(ns: NS, target: string){

}

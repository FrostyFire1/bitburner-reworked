import { NS } from "@ns";
import {getServerList, batchPotential, isPrepped, prepServer, movePayload} from "/rework/lib";
let STEAL_PERCENTAGE = 0.5;


export async function main(ns: NS) {
    ns.disableLog('ALL'); ns.clearLog(); ns.tail();

    movePayload(ns, ns.ls("home","scripts/payload"));
    const targetable = getServerList(ns)
    .sort((a,b) => {return batchPotential(ns, b) - batchPotential(ns, a);})
    .filter(hostname => ns.hasRootAccess(hostname));
    let toPrep = targetable.filter(s => !isPrepped(ns, s));
    for(const hostname of toPrep){
        await prepServer(ns, hostname);
    }

    const target = targetable.filter(s => isPrepped(ns,s))[0];

    if(hasEnoughThreads(ns, target)) batchServer(ns, target);

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
        hThreads,
        gThreads,
        wThreads,
    };

}

function hasEnoughThreads(ns: NS, target: string){

}

function batchServer(ns: NS, target: string){

}

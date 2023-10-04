import { NS } from "@ns";
import {getServerList, batchPotential, isPrepped, SEC_DEC_WEAKEN} from "./rework/lib";
let STEAL_PERCENTAGE = 0.5;

const TARGET = "foodnstuff";

export async function main(ns: NS) {
    ns.disableLog('ALL'); ns.clearLog(); ns.tail();
    const targets = getServerList(ns)
    .sort((a,b) => {return batchPotential(ns, b) - batchPotential(ns, a);});
    let toPrep = targets.filter(a => !isPrepped(ns, a));
    ns.print(toPrep);    
}

function simulateBatch(ns: NS, server: string){

    let sim = ns.getServer(server);
    const player = ns.getPlayer();
    sim.hackDifficulty = sim.minDifficulty;
    sim.moneyAvailable = sim.moneyMax;
    
    const hp = ns.formulas.hacking.hackPercent(sim, player);
    const hthreads = Math.ceil(STEAL_PERCENTAGE / hp);
    sim.moneyAvailable = sim.moneyMax * STEAL_PERCENTAGE;
    sim.hackDifficulty += Math.min(ns.hackAnalyzeSecurity(hthreads,server), 100-sim.hackDifficulty);

    const gthreads = ns.formulas.hacking.growThreads(sim, player, sim.moneyMax);
    sim.hackDifficulty += Math.min(ns.growthAnalyzeSecurity(gThreads, server,1),100-sim.hackDifficulty);

    const wThreads = Math.ceil((sim.hackDifficulty - sim.minDifficulty) / SEC_DEC_WEAKEN);

}

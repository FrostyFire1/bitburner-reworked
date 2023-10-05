
import { NS } from "@ns";
import { prepServer } from "rework/batchHelpers/lib";

export async function main(ns: NS) {
    await prepServer(ns, ns.args[0]);
}
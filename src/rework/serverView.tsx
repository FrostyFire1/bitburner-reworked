import { getServerList } from "./rework/lib";
import type { NS } from "@ns";
export async function main(ns: NS) {
    ns.disableLog("ALL"); ns.clearLog(); ns.tail();
    const size = ns.ui.windowSize();
    ns.resizeTail(size[0],size[1]);
    ns.moveTail(0,0);
    const servers = getServerList(ns)
    .filter(s => s != "home" && !ns.getPurchasedServers().includes(s))
    .map(s=>ns.getServer(s))
    .sort((a,b)=>{return b.moneyMax - a.moneyMax});

    
    const paragraph = (color, text, margin = "1em") => <p style={{"color": color, "margin": margin}}>{text}</p>;
    const openerCount = ["BruteSSH.exe","FTPCrack.exe","RelaySMTP.exe","HTTPWorm.exe","SQLInject.exe"]
    .filter(f => ns.fileExists(f,"home"))
    .length;

    while(true){
        ns.clearLog();
        let infoList = {
            name:[paragraph("cyan","Server Name")],
            hackLevel:[paragraph("green","Hack Level")],
            ram:[paragraph("purple","RAM")],
            money:[paragraph("yellow","Money")],
            minSec:[paragraph("white","Min Sec")],
            curSec:[paragraph("green","Current Sec")],
            portReq:[paragraph("white","Port Req")],
        }
    
        for(const server of servers){
            //Name
            let color = "cyan";
            let symbol = server.hasAdminRights ? "✔" : "✘";
            infoList.name.push(
                paragraph(color, `${server.hostname} ${symbol}`)
            );
            //Hack Level
            color = "green";
            if(server.requiredHackingSkill > ns.getHackingLevel()) color = "red";
            infoList.hackLevel.push(
                paragraph(color, server.requiredHackingSkill)
            );
            //RAM
            infoList.ram.push(
                paragraph("purple", `${server.ramUsed} / ${server.maxRam} GB`)
            );
            //Money
            infoList.money.push(
                paragraph("yellow", `${ns.formatNumber(server.moneyAvailable)} / ${ns.formatNumber(server.moneyMax)} (${ns.formatPercent(1)})`)
            );
            //Min Security
            infoList.minSec.push(
                paragraph("white", server.minDifficulty)
            );
            //Current Security
            color = "green";
            if(server.hackDifficulty > server.minDifficulty + 20) color = "red"
            else if(server.hackDifficulty > server.minDifficulty + 10) color = "orange"
            else if(server.hackDifficulty > server.minDifficulty + 3) color = "yellow"
            infoList.curSec.push(
                paragraph(color, server.hackDifficulty)
            )
            //Port Requirement
            color = "green";
            if(server.numOpenPortsRequired > openerCount) color = "red";
            infoList.portReq.push(
                paragraph(color, server.numOpenPortsRequired)
            )
        }
        const column = (list) =>
        <div style={{"border": "1px solid gray"}}>
            {list}
        </div>
        ns.printRaw(
            <div style={{"display":"flex", "flex-direction":"row"}}>
                {column(infoList.name)}
                {column(infoList.hackLevel)}
                {column(infoList.ram)}
                {column(infoList.money)}
                {column(infoList.minSec)}
                {column(infoList.curSec)}
                {column(infoList.portReq)}
                
            </div>
        )
        await ns.sleep(500);
    }
    
}
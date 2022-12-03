import React, { useEffect, useState } from "react";
import IconSend from "@src/assets/icons/send.svg";
import IconInteraction from "@src/assets/icons/interaction.svg";
import IconActivate from "@src/assets/icons/activate.svg";
import IconAdd from "@src/assets/icons/add.svg";
import IconRemove from "@src/assets/icons/remove.svg";
// import IconReceive from "@src/assets/icons/receive.svg";
import config from "@src/config";
import { getLocalStorage, setLocalStorage } from "@src/lib/tools";

const getIconMapping = (actionName: string) => {
    switch (actionName) {
        case "Send ETH":
            return IconSend;
        case "Send Assets":
            return IconSend;
        case "Activate Wallet":
            return IconActivate;
        case "Add Guardian":
            return IconAdd;
        case "Remove Guardian":
            return IconRemove;
        default:
            return IconInteraction;
    }
};

export default function Activities() {
    const [historyList, setHistoryList] = useState<any>([]);

    const getHistory = async () => {
        const res = (await getLocalStorage("activityHistory")) || [];
        setHistoryList(res);
    };

    useEffect(() => {
        getHistory();
    }, []);

    return (
        <div className="relative">
            {(!historyList || historyList.length === 0) && (
                <div className="text-center py-6">
                    You don't have any activities yet.
                </div>
            )}
            {historyList.map((item: any) => (
                <a
                    href={`${config.scanUrl}/tx/${item.txHash}`}
                    target="_blank"
                    className="flex items-center justify-between py-5 px-3 cursor-pointer text-base hover:bg-gray-100"
                >
                    <div className="flex items-center gap-2">
                        <img
                            src={getIconMapping(item.actionName)}
                            className="w-10"
                        />
                        <div className="flex flex-col">
                            <div>{item.actionName}</div>
                            {item.txHash && (
                                <div className="flex flex-col justify-between opacity-50 text-black">
                                    {item.txHash.slice(0, 4)}...
                                    {item.txHash.slice(-4)}
                                </div>
                            )}
                        </div>
                    </div>
                    {/* <div>{item.amount}</div> */}
                </a>
            ))}
        </div>
    );
}

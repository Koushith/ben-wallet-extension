import React, { useState, forwardRef, useImperativeHandle } from "react";
import cn from "classnames";
import { WalletLib } from "soul-wallet-lib";
import useWalletContext from "@src/context/hooks/useWalletContext";
import AddressIcon from "../AddressIcon";
import Button from "../Button";

export default forwardRef<any>((props, ref) => {
    const { account, getEthBalance } = useWalletContext();
    const [ethBalance, setEthBalance] = useState<string>("");
    const [visible, setVisible] = useState<boolean>(false);
    const [actionName, setActionName] = useState<string>("");
    const [promiseInfo, setPromiseInfo] = useState<any>({});
    const [decodedData, setDecodedData] = useState<any>({});

    useImperativeHandle(ref, () => ({
        async show(operation: any, _actionName: string) {
            setActionName(_actionName);
            const balance = await getEthBalance();
            setEthBalance(balance);

            // todo, there's a problem when sendETH
            if (operation) {
                const tmpMap = new Map<string, string>();
                WalletLib.EIP4337.Utils.DecodeCallData.new().setStorage(
                    (key, value) => {
                        tmpMap.set(key, value);
                    },
                    (key) => {
                        const v = tmpMap.get(key);
                        if (typeof v === "string") {
                            return v;
                        }
                        return null;
                    },
                );

                const callDataDecode =
                    await WalletLib.EIP4337.Utils.DecodeCallData.new().decode(
                        operation.callData,
                    );
                console.log(`callDataDecode:`, callDataDecode);
                setDecodedData(callDataDecode);
            }

            return new Promise((resolve, reject) => {
                setPromiseInfo({
                    resolve,
                    reject,
                });
                setVisible(true);
            });
        },
    }));

    const onReject = async () => {
        promiseInfo.reject();
        setVisible(false);
    };

    const onConfirm = async () => {
        promiseInfo.resolve();
        setVisible(false);
    };

    return (
        <div
            ref={ref}
            className={cn(
                "flex flex-col justify-between h-full p-6 z-20 absolute top-0 bottom-0 left-0 right-0 bg-white",
                !visible && "hidden",
            )}
        >
            <div>
                <div className="page-title mb-10">Signature Request</div>
                <div className="mb-6">
                    <div className="mb-4">Account</div>
                    <div className="flex gap-2 items-center">
                        <AddressIcon width={48} address={account} />
                        <div>
                            <div className="font-bold text-lg font-sans">
                                {account.slice(0, 6)}...{account.slice(-6)}
                            </div>
                            <div>Balance: {ethBalance} ETH</div>
                        </div>
                    </div>
                </div>
                {/* <div className="mb-6">
                    <div className="mb-2">Origin</div>
                    <div className="font-bold text-lg">
                        https://soul.wallet.app
                    </div>
                </div> */}
                <div>
                    <div className="mb-2">Message</div>
                    <div className="font-bold bg-gray40 p-3 rounded-lg">
                        {actionName
                            ? actionName
                            : decodedData
                            ? JSON.stringify(decodedData)
                            : ""}
                    </div>
                </div>
            </div>

            <div className="flex gap-2">
                <Button classNames="w-1/2" onClick={onReject}>
                    Cancel
                </Button>
                <Button classNames="btn-blue w-1/2" onClick={onConfirm}>
                    Sign
                </Button>
            </div>
        </div>
    );
});

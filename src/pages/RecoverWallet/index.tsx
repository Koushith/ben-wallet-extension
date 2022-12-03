import React, { useState, useEffect } from "react";
import Logo from "@src/components/Logo";
import Button from "@src/components/Button";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

import ImgSuccessCat from "@src/assets/success-cat.svg";
import { CreatePassword } from "@src/components/CreatePassword";

export function RecoverWallet() {
    const [progress, setProgress] = useState<number>();
    const navigate = useNavigate();
    const [cachedEmail, setCachedEmail] = useState<string>("");
    const [step, setStep] = useState<number>(0);
    const [detail, setDetail] = useState<any>({});
    const [newOwnerAddress, setNewOwnerAddress] = useState<string | null>("");
    const [recoveringWallet, setRecoveringWallet] = useState(false);

    const progressStyle = {
        "--value": progress,
        "--size": "72px",
    } as React.CSSProperties;

    return (
        <>
            <div className="p-6 h-full flex flex-col">
                <Logo />

                <>
                    <div className="page-title mb-4">Recover Wallet</div>

                    <div className="text-xs">
                        Below are the Account that you can recover
                        <br />
                    </div>

                    <div className="mt-2 flex items-center justify-between py-5 px-3 cursor-pointer bg-gray-100">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" className="checkbox" />

                            <div className="text-sm flex items-center gap-1 overflow-hidden">
                                {/* map */}
                                <p className="overflow-hidden text-ellipsis w-40">
                                    {" "}
                                    0x9264c4Dd3Ef78Ac7D7Fc37605B6a870a2803dc3B
                                </p>
                            </div>
                        </div>
                    </div>
                    <a className="btn btn-blue w-full mt-6">Recover</a>
                    {/* reocover success -conditional rendering*/}
                    {/* <RecoverySuccess /> */}
                </>
            </div>
        </>
    );
}

export const RecoverySuccess = () => {
    return (
        <>
            <img src={ImgSuccessCat} className="block mx-auto mb-12" />
            <div className="page-title mb-3">Congratulation!</div>
            <div className="page-desc leading-6">Your wallet is recovered!</div>
            <div className="fixed bottom-10 left-6 right-6">
                <Link to="/wallet" className="btn btn-blue w-full">
                    My Wallet
                </Link>
            </div>
        </>
    );
};

import Button from "@src/components/Button";
import { Input } from "@src/components/Input";
import { Navbar } from "@src/components/Navbar";
import React, { useState } from "react";
import { ToastContainer, toast } from "material-react-toastify";
import "material-react-toastify/dist/ReactToastify.css";
import { useNavigate } from "react-router-dom";
import { getDefaultProvider, Wallet } from "ethers";
const randomBytes = require("randombytes");
import { JsonRpcProvider } from "@ethersproject/providers";
import { Accounts } from "@src/lib/accounts";
import { keccak256 } from "ethers/lib/utils";

export const CreateRecovery = () => {
    const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
    const [claimType, setClaimType] = useState("");
    const [DDayTime, setDDayTime] = useState("");
    const [loader, setLoader] = useState(false);
    let account: Accounts;

    console.log("works", claimType);
    console.log("bene", beneficiaryAddress);
    const navigate = useNavigate();

    const saveBeneficiary = () =>
        toast.success("Beneficiary added successfully !");

    const recoveryHandler = () => {
        // recover logic

        setLoader(true);
        setTimeout(() => {
            saveBeneficiary();
            setLoader(false);
        }, 3000);
    };

    const createRecovery = async () => {
        const network = "http://localhost:8545";
        const bundlerUrl = "http://localhost:3000/rpc";
        const deployDeployer = true;
        const provider = getDefaultProvider(network) as JsonRpcProvider;
        const signer = provider.getSigner();

        // account owner address
        const storedAccountOwner = localStorage.getItem("accountOwner");

        let accountOwner;
        if (storedAccountOwner) {
            accountOwner = new Wallet(storedAccountOwner);
        } else {
            const privateKey = randomBytes(32).toString("hex");
            accountOwner = new Wallet(privateKey);
            localStorage.setItem("accountOwner", privateKey);
        }
        console.log(accountOwner);

        const index = Date.now();
        account = await new Accounts(accountOwner, index).init();

        let accountAddress = await account.getAddress();
        localStorage.setItem("accountAddress", accountAddress);

        await account.fundAccount(signer, accountAddress);

        const data = keccak256(Buffer.from("nonce()")).slice(0, 10);

        await account.createRecovery(
            accountAddress,
            "0x2DF1592238420ecFe7f2431360e224707e77fA0E",
            0,
        );

        recoveryHandler();
    };

    return (
        <>
            <ToastContainer autoClose={5000} />
            <Navbar backUrl="/wallet" />
            <div className="p-4 pt-0">
                <div className="page-title mb-4">Create Recovery</div>

                <div className="form-control w-full">
                    <div className="mb-2">
                        <Input
                            label="Account Address"
                            type="text"
                            placeholder="account address"
                            value={beneficiaryAddress}
                            error={""}
                            onChange={setBeneficiaryAddress}
                        />
                    </div>
                    <div className="mb-2">
                        <label className="label">
                            <span className="label-text">
                                Select Claim Type
                            </span>
                        </label>
                        <select
                            className="input select-bordered w-full max-w-xs"
                            value={claimType}
                            onChange={(e) => setClaimType(e.target.value)}
                        >
                            <option disabled>Select Calim Type</option>
                            <option>DDay</option>
                            <option selected>Signalling</option>
                        </select>
                    </div>

                    {claimType === "DDay" && (
                        <div className="mb-2">
                            <Input
                                label="Select the Date"
                                type="datetime-local"
                                value={DDayTime}
                                error={""}
                                onChange={setDDayTime}
                            />
                        </div>
                    )}

                    <Button
                        classNames="btn-blue "
                        onClick={createRecovery}
                        loading={loader}
                    >
                        {loader ? "Saving..." : "Save"}
                    </Button>
                </div>
            </div>
        </>
    );
};

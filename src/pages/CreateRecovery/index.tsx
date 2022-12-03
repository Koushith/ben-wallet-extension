import Button from "@src/components/Button";
import { Input } from "@src/components/Input";
import { Navbar } from "@src/components/Navbar";
import React, { useState } from "react";

export const CreateRecovery = () => {
    const [beneficiaryAddress, setBeneficiaryAddress] = useState("");
    const [claimType, setClaimType] = useState("");
    const [DDayTime, setDDayTime] = useState("");

    console.log("works", claimType);
    console.log("bene", beneficiaryAddress);

    return (
        <>
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

                    <Button classNames="btn-blue " onClick={() => undefined}>
                        Save
                    </Button>
                </div>
            </div>
        </>
    );
};

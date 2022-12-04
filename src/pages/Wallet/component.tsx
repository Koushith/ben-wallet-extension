import React from "react";
import { Navbar } from "@src/components/Navbar";

import AccountInfo from "@src/components/AccountInfo";
import Operations from "./comp/Operations";
import Actions from "./comp/Actions";

export function Wallet() {
    return (
        <>
            <Navbar />
            <AccountInfo action="activate" />

            <Actions />

            <Operations />
        </>
    );
}

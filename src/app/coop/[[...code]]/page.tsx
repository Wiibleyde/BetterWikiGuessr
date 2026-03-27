"use client";
import { useParams } from "next/navigation";
import CoopHome from "@/components/coop/CoopHome";
import Lobby from "@/components/lobby";

const page = () => {
    const params = useParams<{ code: string }>();
    const code = params.code;

    if (!code) {
        return <CoopHome />;
    }

    return <Lobby code={code} />;
};

export default page;

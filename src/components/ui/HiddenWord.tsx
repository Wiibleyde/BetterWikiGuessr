import { plural } from "@/utils/helper";

interface HiddenWordProps {
    length: number;
}

const HiddenWord = ({
    length
}: HiddenWordProps) => {
    return (
        <span
            className="inline-block bg-gray-300 rounded-sm mx-px align-middle cursor-default"
            style={{ width: `${length}ch`, height: "1.15em" }}
            title={plural(length, "caractère", "caractères")}
        />
    )
}

export default HiddenWord
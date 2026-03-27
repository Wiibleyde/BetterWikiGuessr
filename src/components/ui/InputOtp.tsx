import { useRef } from "react";
import { cn } from "@/utils/cn";
import Input from "./Input";

interface InputOtpProps extends React.HTMLAttributes<HTMLDivElement> {
    length: number;
    setCode: (code: Array<string>) => void;
    value: Array<string>;
}

export default function InputOtp({
    length,
    setCode,
    className,
    value,
    ...props
}: InputOtpProps) {
    const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

    // Setter de ref pour respecter biomelint
    const setInputRef = (index: number) => (el: HTMLInputElement | null) => {
        inputsRef.current[index] = el;
    };

    const handleChange = (index: number, value: string) => {
        const sanitizedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, "");
        const newCode = [...value];
        newCode[index] = sanitizedValue;
        setCode(newCode);

        if (sanitizedValue && index < length - 1) {
            inputsRef.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
        if (
            e.key === "Backspace" &&
            !inputsRef.current[index]?.value &&
            index > 0
        ) {
            inputsRef.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasteData = e.clipboardData
            .getData("Text")
            .slice(0, length)
            .split("");
        pasteData.forEach((char, i) => {
            const input = inputsRef.current[i];
            if (input) {
                input.value = char;
            }
        });
        setCode(pasteData);
        if (pasteData.length < length) {
            inputsRef.current[pasteData.length - 1]?.focus();
        }
    };

    return (
        <div
            className={cn("flex flex-row gap-2 justify-center", className)}
            {...props}
        >
            {Array.from({ length }).map((_, i) => (
                <Input
                    // biome-ignore lint/suspicious/noArrayIndexKey: <- Justification: Index is stable and directly tied to the input's position>
                    key={i}
                    ref={setInputRef(i)}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={(e) => handlePaste(e)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    className="w-12 h-12 text-center text-lg rounded-md border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none transition-colors duration-200"
                />
            ))}
        </div>
    );
}

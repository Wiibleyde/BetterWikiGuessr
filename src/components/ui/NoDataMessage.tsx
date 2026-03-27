interface NoDataMessageProps {
    message: string;
}

export default function NoDataMessage({ message }: NoDataMessageProps) {
    return (
        <div className="h-full flex items-center justify-center bg-stone-50">
            <p className="text-gray-500 text-sm">{message}</p>
        </div>
    );
}

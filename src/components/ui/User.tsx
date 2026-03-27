import Image from "next/image";

interface UserProps {
    name: string;
    image: string | null;
    pictureWidth?: number;
}

export default function User({ name, image, pictureWidth = 20 }: UserProps) {
    return (
        <div className="flex items-center gap-2 min-w-0">
            {image ? (
                <Image
                    src={image}
                    alt={name}
                    width={pictureWidth}
                    height={pictureWidth}
                    className="rounded-full shrink-0"
                />
            ) : (
                <div
                    style={{
                        width: pictureWidth,
                        height: pictureWidth,
                    }}
                    className="w-5 h-5 rounded-full bg-gray-200 shrink-0"
                />
            )}
            <span className="text-sm font-medium text-gray-800 truncate">
                {name}
            </span>
        </div>
    );
}

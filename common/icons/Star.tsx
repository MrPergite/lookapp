const Star = ({ className, fillPercentage = 100 }: { className: string, fillPercentage: number }) => {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            width="1em"
            height="1em"
        >
            <path
                d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                fill="yellow"
            />
            {fillPercentage < 100 && (
                <path
                    d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                    fill="gray"
                    style={{
                        width: `${fillPercentage}%`,
                        clipPath: `inset(0 0 0 ${fillPercentage}%)`
                    }}
                />
            )}
        </svg>
    );
};

export default Star;

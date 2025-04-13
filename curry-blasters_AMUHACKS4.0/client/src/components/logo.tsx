import { FaLeaf } from "react-icons/fa";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  withText?: boolean;
}

export function Logo({ size = "md", withText = true }: LogoProps) {
  const sizes = {
    sm: {
      container: "h-6 w-6",
      icon: "h-4 w-4",
      text: "text-lg",
    },
    md: {
      container: "h-8 w-8",
      icon: "h-5 w-5",
      text: "text-2xl",
    },
    lg: {
      container: "h-12 w-12",
      icon: "h-8 w-8",
      text: "text-3xl",
    },
  };

  return (
    <div className="flex items-center">
      <div className="bg-white rounded-full p-1 shadow-md mr-2">
        <div className={`bg-primary rounded-full p-1 flex items-center justify-center ${sizes[size].container}`}>
          <FaLeaf className={`text-white ${sizes[size].icon}`} />
        </div>
      </div>
      {withText && (
        <h1 className={`font-bold text-[#CC2121] ${sizes[size].text}`}>
          Curry Blasters
        </h1>
      )}
    </div>
  );
}

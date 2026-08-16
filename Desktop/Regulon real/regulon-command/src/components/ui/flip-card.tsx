import * as React from "react";
import { cn } from "@/lib/utils";

interface FlipCardProps {
  children: React.ReactNode;
  backContent: React.ReactNode;
  className?: string;
  flipDirection?: "horizontal" | "vertical";
}

const FlipCard = React.forwardRef<HTMLDivElement, FlipCardProps>(
  ({ children, backContent, className, flipDirection = "horizontal" }, ref) => {
    const [isFlipped, setIsFlipped] = React.useState(false);
    const [hasFlipped, setHasFlipped] = React.useState(false);

    const handleMouseEnter = () => {
      if (!hasFlipped) {
        setIsFlipped(true);
        setHasFlipped(true);
        
        // Reset after animation completes
        setTimeout(() => {
          setIsFlipped(false);
          setTimeout(() => {
            setHasFlipped(false);
          }, 600);
        }, 600);
      }
    };

    return (
      <div
        ref={ref}
        className={cn("flip-card-container", className)}
        onMouseEnter={handleMouseEnter}
        style={{
          perspective: "1000px",
        }}
      >
        <div
          className={cn(
            "flip-card-inner relative w-full h-full transition-transform duration-500 ease-out",
            flipDirection === "horizontal" ? "flip-horizontal" : "flip-vertical"
          )}
          style={{
            transformStyle: "preserve-3d",
            transform: isFlipped 
              ? flipDirection === "horizontal" 
                ? "rotateY(180deg)" 
                : "rotateX(180deg)"
              : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="flip-card-front absolute inset-0 w-full h-full"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
            }}
          >
            {children}
          </div>
          
          {/* Back */}
          <div
            className="flip-card-back absolute inset-0 w-full h-full flex items-center justify-center"
            style={{
              backfaceVisibility: "hidden",
              WebkitBackfaceVisibility: "hidden",
              transform: flipDirection === "horizontal" 
                ? "rotateY(180deg)" 
                : "rotateX(180deg)",
            }}
          >
            {backContent}
          </div>
        </div>
      </div>
    );
  }
);

FlipCard.displayName = "FlipCard";

export { FlipCard };

import * as React from "react";
import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "accent" | "critical" | "warning" | "success";
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "default", hover = false, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded border backdrop-blur-md text-card-foreground shadow-sm",
          // Background configurations
          "bg-slate-900/60 border-slate-800/80",
          // Variant glow-borders
          variant === "accent" && "border-accent/40 shadow-[0_0_15px_rgba(59, 130, 246,0.08)]",
          variant === "critical" && "border-critical/40 shadow-[0_0_15px_rgba(239,68,68,0.08)]",
          variant === "warning" && "border-warning/40 shadow-[0_0_15px_rgba(245,158,11,0.08)]",
          variant === "success" && "border-success/40 shadow-[0_0_15px_rgba(34,197,94,0.08)]",
          // Hover configuration
          hover && "glass-card-hover cursor-pointer",
          className
        )}
        {...props}
      />
    );
  }
);
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex flex-col space-y-1.5 p-4 border-b border-slate-800/40 font-mono", className)}
      {...props}
    />
  )
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn("text-sm font-bold leading-none tracking-wider text-slate-100 uppercase flex items-center gap-2", className)}
      {...props}
    />
  )
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn("text-[10px] text-slate-500 font-mono tracking-wide uppercase", className)}
      {...props}
    />
  )
)
;CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("p-4 font-mono", className)} {...props} />
  )
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("flex items-center p-4 pt-0 border-t border-slate-800/40 text-[10px] font-mono text-slate-500", className)}
      {...props}
    />
  )
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };

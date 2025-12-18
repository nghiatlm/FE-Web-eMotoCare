import { useTheme } from "next-themes";
import { Toaster as Sonner, toast } from "sonner";
const Toaster = ({ ...props }) => {
    const { theme = "system" } = useTheme();
    return (<Sonner 
        theme={theme} 
        position="top-right"
        className="toaster group" 
        toastOptions={{
            classNames: {
                toast: "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
                error: "group-[.toaster]:bg-red-500 group-[.toaster]:text-white group-[.toaster]:border-red-600",
                success: "group-[.toaster]:bg-green-500 group-[.toaster]:text-white group-[.toaster]:border-green-600",
                warning: "group-[.toaster]:bg-yellow-500 group-[.toaster]:text-white group-[.toaster]:border-yellow-600",
                info: "group-[.toaster]:bg-blue-500 group-[.toaster]:text-white group-[.toaster]:border-blue-600",
                description: "group-[.toast]:text-muted-foreground",
                actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
                cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
            },
        }} 
        {...props}
    />);
};
export { Toaster, toast };

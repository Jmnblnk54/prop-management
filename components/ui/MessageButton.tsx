"use client";

import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";
import { openOrCreateThread } from "@/lib/messaging";

type CommonProps = {
    className?: string;
    label?: string;
    onCreated?: (threadId: string) => void;
    loginPathOverride?: string;
    destPathBaseOverride?: string;
};

function withMessageRouting<
    P extends object,
    Mode extends "admin" | "tenant" = "admin" | "tenant"
>(cfg: {
    mode: Mode;
    loginPath: string;
    destPathBase: string;
}) {
    type RoleProps =
        & CommonProps
        & (Mode extends "admin"
            ? { tenantId: string }
            : { adminId: string }
        );

    return function MessageButton(props: RoleProps & P) {
        const router = useRouter();

        const handleClick = async () => {
            const user = auth.currentUser;
            const loginPath = props.loginPathOverride ?? cfg.loginPath;
            const destBase = props.destPathBaseOverride ?? cfg.destPathBase;

            if (!user) {
                router.push(`${loginPath}?next=${encodeURIComponent(destBase)}`);
                return;
            }

            let adminId: string;
            let tenantId: string;

            if (cfg.mode === "admin") {
                adminId = user.uid;
                tenantId = (props as any).tenantId;
            } else {
                tenantId = user.uid;
                adminId = (props as any).adminId;
            }

            const { id } = await openOrCreateThread(adminId, tenantId);
            props.onCreated?.(id);
            router.push(`${destBase}?thread=${id}`);
        };

        const label = (props.label ?? (cfg.mode === "admin" ? "Message tenant" : "Message landlord"));

        return (
            <button
                type="button"
                onClick={handleClick}
                className={props.className ?? "rounded border px-3 py-1 text-sm hover:bg-gray-50"}
            >
                {label}
            </button>
        );
    };
}

export const AdminMessageTenantButton = withMessageRouting({
    mode: "admin",
    loginPath: "/login",
    destPathBase: "/admin/messages",
});

export const TenantMessageAdminButton = withMessageRouting({
    mode: "tenant",
    loginPath: "/login",
    destPathBase: "/tenant/messages",
});

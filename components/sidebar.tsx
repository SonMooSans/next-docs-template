"use client";
import clsx from "clsx";
import { ChevronDownIcon, MenuIcon } from "lucide-react";
import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { TreeNode, FileNode, FolderNode } from "next-docs-zeta/server";
import dynamic from "next/dynamic";
import { CommandShortcut } from "./ui/command";
import * as Base from "next-docs-zeta/sidebar";

const SearchDialog = dynamic(() => import("./dialog/search"));

export function SidebarProvider({ children }: { children: ReactNode }) {
    return (
        <Base.SidebarProvider>
            <Base.SidebarTrigger className="sticky flex flex-row w-full top-12 gap-2 h-12 text-sm bg-background border-b-[1px] px-8 items-center z-50 sm:px-14 lg:hidden">
                <MenuIcon className="w-4 h-4" />
                Menu
            </Base.SidebarTrigger>

            {children}
        </Base.SidebarProvider>
    );
}

export function Sidebar({ items }: { items: TreeNode[] }) {
    const [openSearch, setOpenSearch] = useState(false);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                setOpenSearch(true);
                e.preventDefault();
            }
        };

        window.addEventListener("keydown", handler);

        return () => {
            window.removeEventListener("keydown", handler);
        };
    }, []);

    return (
        <Base.SidebarList
            minWidth={1024} // lg
            className={clsx(
                "flex flex-col gap-3 fixed inset-0 top-24 overflow-auto",
                "lg:sticky lg:top-12 lg:py-16 lg:max-h-[calc(100vh-3rem)]",
                "max-lg:py-4 max-lg:px-8 max-lg:sm:px-14 max-lg:bg-background/50 max-lg:backdrop-blur-xl max-lg:z-40 max-lg:data-[open=false]:hidden"
            )}
        >
            <button
                className="flex flex-row items-center border-[1px] rounded-md text-muted-foreground bg-background cursor-pointer px-4 py-2 text-left text-sm"
                onClick={() => setOpenSearch(true)}
            >
                Search Docs...
                <CommandShortcut className="ml-auto">⌘K</CommandShortcut>
            </button>
            {openSearch && <SearchDialog open onOpenChange={setOpenSearch} />}
            {items.map((item, i) => (
                <Node key={i} item={item} />
            ))}
        </Base.SidebarList>
    );
}

function Node({ item }: { item: TreeNode }) {
    if (item.type === "separator")
        return (
            <p className="font-semibold text-sm mt-3 first:mt-0">{item.name}</p>
        );
    if (item.type === "folder") return <Folder item={item} />;

    return <Item item={item} />;
}

function Item({ item }: { item: FileNode }) {
    const { url, name } = item;
    const pathname = usePathname();
    const active = pathname === url;

    return (
        <Link
            href={url}
            className={clsx(
                "text-sm w-full",
                active
                    ? "text-accent-foreground font-semibold"
                    : "text-muted-foreground hover:text-foreground"
            )}
        >
            {name}
        </Link>
    );
}

function Folder({ item }: { item: FolderNode }) {
    const { name, children, index } = item;

    const pathname = usePathname();
    const active = pathname === item.url;
    const childActive = pathname.startsWith(item.url + "/");
    const [extend, setExtend] = useState(active || childActive);

    useEffect(() => {
        if (active || childActive) {
            setExtend(true);
        }
    }, [active, childActive]);

    const As = index == null ? "p" : Link;
    return (
        <div className="w-full">
            <button
                className={clsx(
                    "flex flex-row text-sm w-full rounded-xl text-start",
                    active
                        ? "font-semibold text-purple-400"
                        : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setExtend((prev) => !prev)}
            >
                <As
                    href={index?.url as any}
                    className="flex-1"
                    onClick={(e) => {
                        if (item.index == null || active) {
                            setExtend((prev) => !prev);
                            e.stopPropagation();
                        }
                    }}
                >
                    {name}
                </As>
                <ChevronDownIcon
                    className={clsx(
                        "w-5 h-5",
                        extend ? "rotate-0" : "-rotate-90"
                    )}
                />
            </button>
            {extend && (
                <ul className="flex flex-col overflow-hidden pl-4 pt-2">
                    {children.map((item, i) => (
                        <Node key={i} item={item} />
                    ))}
                </ul>
            )}
        </div>
    );
}

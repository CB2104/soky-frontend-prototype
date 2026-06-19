"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { NavTabsProps, NavTabItem } from "@/constants";

type Position = {
  left: number;
  width: number;
  opacity: number;
};

const emptyPosition: Position = {
  left: 0,
  width: 0,
  opacity: 0,
};

const NavTabs = ({ items }: NavTabsProps) => {
  const pathname = usePathname();

  const [activePosition, setActivePosition] = useState<Position>(emptyPosition);
  const [hoverPosition, setHoverPosition] = useState<Position>(emptyPosition);
  const [hoveredHref, setHoveredHref] = useState<string | null>(null);

  const isItemActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <ul
      onMouseLeave={() => {
        setHoveredHref(null);
        setHoverPosition((current) => ({
          ...current,
          opacity: 0,
        }));
      }}
      className="relative flex w-fit rounded-full border border-white/20 bg-soky-white p-1"
    >
      <Pill position={activePosition} className="z-10 bg-soky-orange-deep" />
      <Pill position={hoverPosition} className="z-0 bg-soky-blue-bright" />

      {items.map((item) => {
        const isActive = isItemActive(item.href);
        const isHovered = hoveredHref === item.href;

        return (
          <Tab
            key={item.href}
            item={item}
            isActive={isActive}
            isHovered={isHovered}
            setActivePosition={setActivePosition}
            setHoverPosition={setHoverPosition}
            setHoveredHref={setHoveredHref}
          />
        );
      })}
    </ul>
  );
};

const Tab = ({
  item,
  isActive,
  isHovered,
  setActivePosition,
  setHoverPosition,
  setHoveredHref,
}: {
  item: NavTabItem;
  isActive: boolean;
  isHovered: boolean;
  setActivePosition: Dispatch<SetStateAction<Position>>;
  setHoverPosition: Dispatch<SetStateAction<Position>>;
  setHoveredHref: Dispatch<SetStateAction<string | null>>;
}) => {
  const ref = useRef<HTMLLIElement | null>(null);

  const measure = useCallback((): Position | null => {
    if (!ref.current) return null;

    const { width } = ref.current.getBoundingClientRect();

    return {
      left: ref.current.offsetLeft,
      width,
      opacity: 1,
    };
  }, []);

  useEffect(() => {
    if (!isActive) return;

    const position = measure();
    if (!position) return;

    setActivePosition(position);
  }, [isActive, measure, setActivePosition]);

  const textColor = isActive || isHovered ? "text-soky-white" : "text-soky-ink";

  return (
    <li ref={ref} className={`relative z-20 block ${textColor}`}>
      <Link
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        onMouseEnter={() => {
          const position = measure();
          if (!position) return;
          setHoveredHref(item.href);
          setHoverPosition(position);
        }}
        onFocus={() => {
          const position = measure();
          if (!position) return;

          setHoveredHref(item.href);
          setHoverPosition(position);
        }}
        onBlur={() => {
          setHoveredHref(null);
          setHoverPosition((current) => ({
            ...current,
            opacity: 0,
          }));
        }}
        className={`relative z-20 block cursor-pointer px-3 py-1.5 text-xs font-bold uppercase transition-colors md:px-5 md:py-3 md:text-base ${textColor}`}
      >
        {item.title}
      </Link>
    </li>
  );
};

const Pill = ({
  position,
  className,
}: {
  position: Position;
  className: string;
}) => {
  return (
    <motion.li
      aria-hidden="true"
      animate={position}
      className={`absolute top-1 h-7 rounded-full md:h-12 ${className}`}
    />
  );
};

export default NavTabs;

import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";

type Styled<P> = Omit<P, "className"> & { className?: string };

const item =
  "flex h-8 pointer-coarse:h-11 cursor-default select-none items-center gap-2 rounded-lg px-2 text-muted-foreground text-sm outline-none data-highlighted:bg-foreground/7 data-highlighted:text-foreground [&_svg]:size-4 [&_svg]:shrink-0";

/** A menu's state: open it from a `MenuTrigger`, list its actions in a `MenuPopup`. */
const Menu = MenuPrimitive.Root;

/** Opens the menu. Pass `render` to make one of our `Button`s the trigger. */
function MenuTrigger(props: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="menu-trigger" {...props} />;
}

/** The floating list, anchored to the trigger, kept inside the viewport. */
function MenuPopup({
  align = "end",
  sideOffset = 6,
  className,
  children,
}: Styled<MenuPrimitive.Popup.Props> & {
  align?: MenuPrimitive.Positioner.Props["align"];
  sideOffset?: number;
}) {
  return (
    <MenuPrimitive.Portal>
      <MenuPrimitive.Positioner
        align={align}
        sideOffset={sideOffset}
        collisionPadding={16}
        className="z-50 outline-none"
      >
        <MenuPrimitive.Popup
          data-slot="menu-popup"
          className={cn(
            "min-w-52 origin-(--transform-origin) rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none transition-[opacity,scale] duration-150 ease-(--ease-out) data-ending-style:scale-95 data-starting-style:scale-95 data-ending-style:opacity-0 data-starting-style:opacity-0 motion-reduce:transition-none",
            className,
          )}
        >
          {children}
        </MenuPrimitive.Popup>
      </MenuPrimitive.Positioner>
    </MenuPrimitive.Portal>
  );
}

/** An action in the menu. */
function MenuItem({ className, ...props }: Styled<MenuPrimitive.Item.Props>) {
  return (
    <MenuPrimitive.Item
      data-slot="menu-item"
      className={cn(item, className)}
      {...props}
    />
  );
}

/** A link in the menu. */
function MenuLinkItem({
  className,
  ...props
}: Styled<MenuPrimitive.LinkItem.Props>) {
  return (
    <MenuPrimitive.LinkItem
      data-slot="menu-link-item"
      className={cn(item, className)}
      {...props}
    />
  );
}

/** A hairline between groups of items. */
function MenuSeparator({
  className,
  ...props
}: Styled<MenuPrimitive.Separator.Props>) {
  return (
    <MenuPrimitive.Separator
      data-slot="menu-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export { Menu, MenuItem, MenuLinkItem, MenuPopup, MenuSeparator, MenuTrigger };

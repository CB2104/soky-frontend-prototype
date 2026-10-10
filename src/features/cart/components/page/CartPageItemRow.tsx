"use client";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { CartItemViewModel } from "../../mappers";
import { CartQuantityStepper } from "../CartQuantityStepper";
import { CartRemoveButton } from "../CartRemoveButton";
import styles from "./CartPage.module.css";

export function CartPageItemRow({item,onDecrease,onIncrease,onRemove,onNotes}:{item:CartItemViewModel;onDecrease:()=>void;onIncrease:()=>void;onRemove:()=>void;onNotes:(notes:string)=>void}) {
  const [editing,setEditing] = useState(false);
  const [failed,setFailed] = useState(false);
  const notesId = `cart-note-${item.id}`;
  return <li className={styles.item}>
    <Link className={styles.itemPhoto} href={item.href} scroll={false} data-transition-ignore="true" aria-label={`Ver ${item.title}`}><Image src={failed ? "/images/products/product-photo-pending.svg" : item.imageUrl} alt="" fill sizes="84px" onError={()=>setFailed(true)}/></Link>
    <div className={styles.itemInfo}><Link className={styles.itemTitle} href={item.href} scroll={false} data-transition-ignore="true">{item.title}</Link><p className={styles.unitPrice}>{item.unitPrice} / unidad</p>
      {item.issue ? <p className={styles.error}>{item.issue}</p> : null}
      <button type="button" className={styles.noteToggle} aria-expanded={editing} aria-controls={notesId} onClick={()=>setEditing(value=>!value)}>{item.notes ? "Editar nota" : "+ Agregar nota"}</button>
      {item.notes && !editing ? <p className={styles.savedNote}>{item.notes}</p> : null}
    </div>
    <div className={styles.itemActions}><CartQuantityStepper label={item.title} quantity={item.quantity} disabledIncrease={!item.canIncrease} onDecrease={onDecrease} onIncrease={onIncrease}/><strong className={styles.lineTotal}>{item.lineTotal}</strong><CartRemoveButton label={item.title} onRemove={onRemove}/></div>
    {editing ? <div className={styles.itemNote}><label htmlFor={notesId}>Nota para {item.title}</label><textarea id={notesId} rows={2} maxLength={200} value={item.notes} onChange={event=>onNotes(event.target.value)} autoFocus/><button type="button" className={styles.noteToggle} onClick={()=>setEditing(false)}>Listo</button></div> : null}
  </li>;
}

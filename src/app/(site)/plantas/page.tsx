import { redirect } from 'next/navigation';

/** /plantas é a raiz das fichas; a navegação do catálogo mora em /explorar. */
export default function PlantsIndex() {
  redirect('/explorar');
}

import fs from 'fs';
export function aplicar(archivo, parches) {
  let src = fs.readFileSync(archivo, 'utf8');
  const fallos = [];
  for (const [nombre, buscar, poner] of parches) {
    const veces = src.split(buscar).length - 1;
    if (veces !== 1) { fallos.push(`${nombre}: aparece ${veces} veces (se esperaba 1)`); continue; }
    src = src.replace(buscar, () => poner); /* función: evita que $& y $$ del reemplazo se interpreten */
    console.log(`  ok  ${nombre}`);
  }
  if (fallos.length) { fallos.forEach((f) => console.log(`  FALLO ${f}`)); process.exitCode = 1; return false; }
  fs.writeFileSync(archivo, src);
  return true;
}

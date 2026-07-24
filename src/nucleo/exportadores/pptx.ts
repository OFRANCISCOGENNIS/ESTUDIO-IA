// =============================================================
// Gerador de PPTX mínimo — cada página do projeto vira um slide com
// uma imagem cobrindo o slide inteiro. Monta a estrutura OpenXML e
// empacota com o escritor de ZIP. Puro, sem dependências.
// =============================================================

import { criarZip, textoParaBytes, ArquivoZip } from './zip'

/** EMUs por pixel (96 DPI) */
const EMU = 9525

const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main'
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'
const NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main'
const CT_REL = 'http://schemas.openxmlformats.org/package/2006/relationships'

const cab = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n'

export interface ImagemSlide {
  jpeg: Uint8Array
  largura: number
  altura: number
}

function contentTypes(n: number): string {
  const slides = Array.from({ length: n }, (_, i) =>
    `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`,
  ).join('')
  return (
    cab +
    `<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">` +
    `<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>` +
    `<Default Extension="xml" ContentType="application/xml"/>` +
    `<Default Extension="jpeg" ContentType="image/jpeg"/>` +
    `<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>` +
    `<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>` +
    `<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>` +
    `<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>` +
    slides +
    `</Types>`
  )
}

const relsRaiz =
  cab +
  `<Relationships xmlns="${CT_REL}">` +
  `<Relationship Id="rId1" Type="${NS_R}/officeDocument" Target="ppt/presentation.xml"/>` +
  `</Relationships>`

function presentation(n: number, cx: number, cy: number): string {
  const sldIds = Array.from({ length: n }, (_, i) =>
    `<p:sldId id="${256 + i}" r:id="rId${i + 2}"/>`,
  ).join('')
  return (
    cab +
    `<p:presentation xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}">` +
    `<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>` +
    `<p:sldIdLst>${sldIds}</p:sldIdLst>` +
    `<p:sldSz cx="${cx}" cy="${cy}"/>` +
    `<p:notesSz cx="${cy}" cy="${cx}"/>` +
    `</p:presentation>`
  )
}

function presentationRels(n: number): string {
  const slides = Array.from({ length: n }, (_, i) =>
    `<Relationship Id="rId${i + 2}" Type="${NS_R}/slide" Target="slides/slide${i + 1}.xml"/>`,
  ).join('')
  return (
    cab +
    `<Relationships xmlns="${CT_REL}">` +
    `<Relationship Id="rId1" Type="${NS_R}/slideMaster" Target="slideMasters/slideMaster1.xml"/>` +
    slides +
    `</Relationships>`
  )
}

function slideXml(cx: number, cy: number): string {
  return (
    cab +
    `<p:sld xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}"><p:cSld><p:spTree>` +
    `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
    `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/><a:chOff x="0" y="0"/><a:chExt cx="${cx}" cy="${cy}"/></a:xfrm></p:grpSpPr>` +
    `<p:pic><p:nvPicPr><p:cNvPr id="2" name="Slide"/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>` +
    `<p:blipFill><a:blip r:embed="rId1"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>` +
    `<p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>` +
    `</p:pic></p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>`
  )
}

function slideRels(indice: number): string {
  return (
    cab +
    `<Relationships xmlns="${CT_REL}">` +
    `<Relationship Id="rId1" Type="${NS_R}/image" Target="../media/image${indice}.jpeg"/>` +
    `</Relationships>`
  )
}

const slideMaster =
  cab +
  `<p:sldMaster xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}"><p:cSld><p:bg><p:bgRef idx="1001"><a:schemeClr val="bg1"/></p:bgRef></p:bg><p:spTree>` +
  `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
  `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>` +
  `</p:spTree></p:cSld>` +
  `<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" accent6="accent6" hlink="hlink" folHlink="folHlink"/>` +
  `<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>` +
  `</p:sldMaster>`

const slideMasterRels =
  cab +
  `<Relationships xmlns="${CT_REL}">` +
  `<Relationship Id="rId1" Type="${NS_R}/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>` +
  `<Relationship Id="rId2" Type="${NS_R}/theme" Target="../theme/theme1.xml"/>` +
  `</Relationships>`

const slideLayout =
  cab +
  `<p:sldLayout xmlns:a="${NS_A}" xmlns:r="${NS_R}" xmlns:p="${NS_P}" type="blank" preserve="1"><p:cSld name="Em branco"><p:spTree>` +
  `<p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>` +
  `<p:grpSpPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>` +
  `</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>`

const slideLayoutRels =
  cab +
  `<Relationships xmlns="${CT_REL}">` +
  `<Relationship Id="rId1" Type="${NS_R}/slideMaster" Target="../slideMasters/slideMaster1.xml"/>` +
  `</Relationships>`

/** Tema mínimo válido (cores, fontes e estilos exigidos pelo master) */
function tema(): string {
  const cor = (nome: string, hex: string) => `<a:${nome}><a:srgbClr val="${hex}"/></a:${nome}>`
  const fill = `<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>`
  const ln = `<a:ln w="9525" cap="flat"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill><a:prstDash val="solid"/></a:ln>`
  return (
    cab +
    `<a:theme xmlns:a="${NS_A}" name="DesignStudio"><a:themeElements>` +
    `<a:clrScheme name="DesignStudio">` +
    `<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1><a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>` +
    cor('dk2', '1E293B') + cor('lt2', 'F8FAFC') +
    cor('accent1', '7C4DFF') + cor('accent2', 'EC4899') + cor('accent3', 'FACC15') +
    cor('accent4', '22D3EE') + cor('accent5', '22C55E') + cor('accent6', 'F97316') +
    cor('hlink', '0563C1') + cor('folHlink', '954F72') +
    `</a:clrScheme>` +
    `<a:fontScheme name="DesignStudio"><a:majorFont><a:latin typeface="Poppins"/><a:ea typeface=""/><a:cs typeface=""/></a:majorFont><a:minorFont><a:latin typeface="Inter"/><a:ea typeface=""/><a:cs typeface=""/></a:minorFont></a:fontScheme>` +
    `<a:fmtScheme name="DesignStudio">` +
    `<a:fillStyleLst>${fill}${fill}${fill}</a:fillStyleLst>` +
    `<a:lnStyleLst>${ln}${ln}${ln}</a:lnStyleLst>` +
    `<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle><a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>` +
    `<a:bgFillStyleLst>${fill}${fill}${fill}</a:bgFillStyleLst>` +
    `</a:fmtScheme>` +
    `</a:themeElements></a:theme>`
  )
}

/** Monta o arquivo .pptx completo */
export function criarPptx(imagens: ImagemSlide[]): Uint8Array {
  const primeira = imagens[0]
  const cx = Math.round((primeira?.largura ?? 1280) * EMU)
  const cy = Math.round((primeira?.altura ?? 720) * EMU)
  const n = imagens.length

  const arquivos: ArquivoZip[] = [
    { nome: '[Content_Types].xml', dados: textoParaBytes(contentTypes(n)) },
    { nome: '_rels/.rels', dados: textoParaBytes(relsRaiz) },
    { nome: 'ppt/presentation.xml', dados: textoParaBytes(presentation(n, cx, cy)) },
    { nome: 'ppt/_rels/presentation.xml.rels', dados: textoParaBytes(presentationRels(n)) },
    { nome: 'ppt/slideMasters/slideMaster1.xml', dados: textoParaBytes(slideMaster) },
    { nome: 'ppt/slideMasters/_rels/slideMaster1.xml.rels', dados: textoParaBytes(slideMasterRels) },
    { nome: 'ppt/slideLayouts/slideLayout1.xml', dados: textoParaBytes(slideLayout) },
    { nome: 'ppt/slideLayouts/_rels/slideLayout1.xml.rels', dados: textoParaBytes(slideLayoutRels) },
    { nome: 'ppt/theme/theme1.xml', dados: textoParaBytes(tema()) },
  ]

  imagens.forEach((img, i) => {
    const idx = i + 1
    arquivos.push({ nome: `ppt/slides/slide${idx}.xml`, dados: textoParaBytes(slideXml(cx, cy)) })
    arquivos.push({ nome: `ppt/slides/_rels/slide${idx}.xml.rels`, dados: textoParaBytes(slideRels(idx)) })
    arquivos.push({ nome: `ppt/media/image${idx}.jpeg`, dados: img.jpeg })
  })

  return criarZip(arquivos)
}

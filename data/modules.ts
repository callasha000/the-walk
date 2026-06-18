import type {
  BuildingModule,
  BuildingZone,
  TrancheId,
  Vector3Tuple,
} from "@/data/module-types";
import {
  registerSheetRect,
  sheetPointToModelPosition,
  sheetSizeToModelSize,
} from "./geometry-calibration";
import { moduleCoordinates } from "./module-coordinates";

type LayoutKind = "east-edge" | "north-wing" | "vertical-wing" | "west-wing";

type SourceGroup = {
  level: number;
  tranche: TrancheId;
  buildingZone: string;
  layout: LayoutKind;
  source: string;
};

const sourceGroups: SourceGroup[] = [
  { level: 1, tranche: 4, buildingZone: "Market Rate East Edge", layout: "east-edge", source: "M9:CFA1M-H2 M1:DB1M-LH2 M3:CA1M-E3 M2:DA1M-LH1 M4:CB1M-C1 M5:CC1M-BKR1 M6:CD1M-1BKL M7:CE1M-A1 M8:CF1M-A2 M10:CG1M-2RB M11:CH1M-K9 M12:CI1M-2BKL M13:CJ1M-BKR2 M14:CK1M-1BKL M15:CL1M-C2 M16:CM1M-E4" },
  { level: 1, tranche: 1, buildingZone: "Market Rate North Wing", layout: "north-wing", source: "M96:A1M-K2 M97:B1M-K1 M98:C1M-B2 M99:D1M-B1 M100:E1M-S1M-K3 M101:F1M-B3M-S2 M102:G1M-K4 M103:H1M-K5M-B4 M116:U1M-KB2 M117:V1M-KB3 M104:I1M-K6 M105:J1M-B5 M106:K1M-E1 M107:L1M-E2 M108:M1M-S3 M109:N1M-KB1 M110:O1M-S4M-KB1 M111:P1M-KB1M-S3 M112:K1M-S3M-KB1 M113:R1M-KB1M-S3 M114:S1M-S4M-KB1 M115:T1M-KB1M-S3" },
  { level: 1, tranche: 2, buildingZone: "Market Rate Vertical Wing", layout: "vertical-wing", source: "M254:AA1M-S3M-KB1 M262:AI1M-KB4 M252:Y1M-F1M-SF1 M253:Z1M-NL2M-NL1 M256:AC1M-S4M-KB1 M257:AD1M-KB1M-S3 M258:AE1M-S3M-KB1 M259:AF1M-KB1M-S3 M263:AJ1M-L1 M264:AK1M-L2 M265:AL1M-P1 M266:AM1M-P2 M255:AB1M-KB1M-S3 M250:W1M-M1 M251:X1M-T1 M260:AG1M-S4M-KB1 M261:AH1M-KB1M-S3" },
  { level: 1, tranche: 3, buildingZone: "Affordable West Wing", layout: "west-wing", source: "M378:BD1M-S4 M379:BC1M-KB7 M380:BB1M-S3 M381:BA1M-KB7 M382:AZ1M-KB17 M383:AY1M-KB6 M384:AX1M-KB5 M385:AW1M-KB16 M386:AV1M-KB5 M387:AU1M-KB6 M388:AT1M-KB15 M389:AS1M-MM1 M390:AR1M-DW1 M391:AQ1M-LA1" },
  { level: 2, tranche: 4, buildingZone: "Market Rate East Edge", layout: "east-edge", source: "M23:CFA2M-H3 M17:CA2M-3RL M30:CM2M-3RR1 M18:CB2M-BKS1 M19:CC2M-BKR1 M20:CD2M-1BKL M21:CE2M-BKS2 M22:CF2M-3RR M24:CG2M-2RB1 M25:CH2M-K9 M26:CI2M-2BKL M27:CJ2M-BKR3 M28:CK2M-BKL3 M29:CL2M-BKS2" },
  { level: 2, tranche: 1, buildingZone: "Market Rate North Wing", layout: "north-wing", source: "M118:A2M-K2W M119:B2M-K1W M120:C2M-B2 M121:D2M-B1 M122:E2M-S1M-K3 M123:F2M-B3M-S2 M124:G2M-K4 M125:H2M-K5M-B4 M126:I2M-K6 M127:J2M-B5 M128:K2M-S5 M129:L2M-KB1 M130:M2M-S3 M131:N2M-KB1 M132:O2M-S4WM-KB1 M133:P2M-KB1M-S3 M134:K2M-S3M-KB1 M135:R2M-KB1M-S3 M136:S2M-S4WM-KB1 M137:T2M-KB1M-S3 M138:U2M-KB2 M139:V2M-KB3" },
  { level: 2, tranche: 2, buildingZone: "Market Rate Vertical Wing", layout: "vertical-wing", source: "M271:AA2M-S3M-KB1 M279:AI2M-KB4 M269:Y2M-KB9M-KB10 M270:Z2M-KB10M-KB9 M273:AC2M-S4WM-KB1 M274:AD2M-KB1M-S3 M275:AE2M-S3M-KB1 M276:AF2M-KB1M-S3 M280:AJ2M-S6 M281:AK2M-K7 M282:AL2M-B7 M283:AM2M-KB11 M272:AB2M-KB1M-S3 M267:W2M-B6 M268:X2M-KB8 M278:AH2M-KB1M-S3 M277:AG2M-S4WM-KB1" },
  { level: 2, tranche: 3, buildingZone: "Affordable West Wing", layout: "west-wing", source: "M394:BD2M-S4W M395:BC2M-KB7 M396:BB2M-S3 M397:BA2M-KB7 M398:AZ2M-KB17W M399:AY2M-KB6W M400:AX2M-KB5W M401:AW2M-KB16W M402:AV2M-KB5W M403:AU2M-KB6W M404:AT2M-KB15W M405:AS2M-KB6W M406:AR2M-KB5W M407:AQ2M-KB12 M408:DB2M-S4W M409:DA2M-K8 M393:BE2M-B5 M392:BF2M-KB13" },
  { level: 3, tranche: 4, buildingZone: "Market Rate East Edge", layout: "east-edge", source: "M37:CFA3M-H4 M44:CM3M-3RR1 M31:CA3M-3RL M32:CB3M-BKS1 M33:CC3M-BKR1 M34:CD3M-1BKL M35:CE3M-BKS3 M36:CF3M-3RR M38:CG3M-2RB2 M39:CH3M-K9 M40:CI3M-2BKL M41:CJ3M-BKR3 M42:CK3M-1BKL M43:CL3M-BKS2" },
  { level: 3, tranche: 1, buildingZone: "Market Rate North Wing", layout: "north-wing", source: "M140:A3M-K2W M141:B3M-K1W M142:C3M-B2 M143:D3M-B1 M144:E3M-S1M-K3 M145:F3M-B3M-S2 M146:G3M-K4 M147:H3M-K5M-B4 M148:I3M-K6 M149:J3M-B5 M150:K3M-S5 M151:L3M-KB1 M152:M3M-S3 M153:N3M-KB1 M154:O3M-S4WM-KB1 M155:P3M-KB1M-S3 M156:K3M-S3M-KB1 M157:R3M-KB1M-S3W M158:S3M-S4WM-KB1 M159:T3M-KB1M-S3 M160:U3M-KB2 M161:V3M-KB3" },
  { level: 3, tranche: 2, buildingZone: "Market Rate Vertical Wing", layout: "vertical-wing", source: "M288:AA3M-S3M-KB1 M289:AB3M-KB1M-S3 M292:AE3M-S3M-KB1 M293:AF3M-KB1M-S3 M294:AG3M-S4WM-KB1 M295:AH3M-KB1M-S3 M297:AJ3M-S6 M298:AK3M-K7 M299:AL3M-B7 M300:AM3M-KB11 M286:Y3M-KB9M-KB10 M291:AD3M-KB1M-S3 M301:AN3M-S7 M302:AO3M-K7 M303:AP3M-KB4 M287:Z3M-KB10M-KB9 M290:AC3M-S4WM-KB1 M296:AI3M-KB4 M284:W3M-B6 M285:X3M-KB8" },
  { level: 3, tranche: 3, buildingZone: "Affordable West Wing", layout: "west-wing", source: "M412:BD3M-S4W M413:BC3M-KB7 M414:BB3M-S3 M415:BA3M-KB7 M416:AZ3M-KB17W M417:AY3M-KB6W M418:AX3M-KB5W M419:AW3M-KB16W M420:AV3M-KB5W M421:AU3M-KB6W M422:AT3M-KB15W M423:AS3M-L4 M424:AR3M-L3 M425:AQ3M-H1 M426:DB3M-S4W M427:DA3M-K8 M411:BE3M-B5 M410:BF3M-KB13W" },
  { level: 4, tranche: 4, buildingZone: "Market Rate East Edge", layout: "east-edge", source: "M51:CFA4M-H4 M45:CA4M-3RL M46:CB4M-BKS1 M47:CC4M-BKR1 M48:CD4M-1BKL M49:CE4M-BKS3 M50:CF4M-3RR M52:CG4M-2RB2 M53:CH4M-K9 M54:CI4M-2BKL M55:CJ4M-BKR3 M56:CK4M-1BKL M57:CL4M-BKS2 M58:CM4M-3RR1" },
  { level: 4, tranche: 1, buildingZone: "Market Rate North Wing", layout: "north-wing", source: "M162:A4M-K2W M163:B4M-K1W M164:C4M-B2 M165:D4M-B1 M166:E4M-S1M-K3 M167:F4M-B3M-S2 M168:G4M-K4 M169:H4M-K5M-B4 M170:I4M-K6 M171:J4M-B5 M172:K4M-S5 M173:L4M-KB1 M174:M4M-S3 M175:N4M-KB1 M176:O4M-S4WM-KB1 M177:P4M-KB1M-S3 M178:K4M-S3M-KB1 M179:R4M-KB1M-S3 M180:S4M-S4WM-KB1 M181:T4M-KB1M-S3 M182:U4M-KB2 M183:V4M-KB3" },
  { level: 4, tranche: 2, buildingZone: "Market Rate Vertical Wing", layout: "vertical-wing", source: "M308:AA4M-S3M-KB1 M309:AB4M-KB1M-S3 M312:AE4M-S3M-KB1 M313:AF4M-KB1M-S3 M314:AG4M-S4WM-KB1 M315:AH4M-KB1M-S3 M317:AJ4M-S6 M318:AK4M-K7 M319:AL4M-B7 M320:AM4M-KB11 M306:Y4M-KB9M-KB10 M311:AD4M-KB1M-S3 M321:AN4M-S7 M322:AO4M-K7 M323:AP4M-KB4 M307:Z4M-KB10M-KB9 M310:AC4M-S4WM-KB1 M316:AI4M-KB4 M304:W4M-B6 M305:X4M-KB8" },
  { level: 4, tranche: 3, buildingZone: "Affordable West Wing", layout: "west-wing", source: "M430:BD4M-S4W M431:BC4M-KB7 M432:BB4M-S3 M433:BA4M-KB7 M434:AZ4M-KB17W M435:AY4M-KB6W M436:AX4M-KB5W M437:AW4M-KB16W M438:AV4M-KB5W M439:AU4M-KB6W M440:AT4M-KB15W M441:AS4M-L4 M442:AR4M-L3 M443:AQ4M-H1 M444:DB4M-S4W M445:DA4M-K8 M429:BE4M-B5 M428:BF4M-KB13W" },
  { level: 5, tranche: 4, buildingZone: "Market Rate East Edge", layout: "east-edge", source: "M65:CFA5M-H4 M59:CA5M-3RL M60:CB5M-BKS1 M61:CC5M-BKR1 M62:CD5M-1BKL M63:CE5M-BKS3 M66:CG5M-2RB2 M67:CH5M-K9 M68:CI5M-2BKL M69:CJ5M-BKR3 M70:CK5M-1BKL M71:CL5M-BKS2 M72:CM5M-3RR1 M64:CF5M-3RR" },
  { level: 5, tranche: 1, buildingZone: "Market Rate North Wing", layout: "north-wing", source: "M184:A5M-K2W M185:B5M-K1W M186:C5M-B2 M187:D5M-B1 M188:E5M-S1M-K3 M189:F5M-B3M-S2 M190:G5M-K4 M191:H5M-K5M-B4 M192:I5M-K6 M193:J5M-B5 M194:K5M-S5 M195:L5M-KB1 M196:M5M-S3 M197:N5M-KB1 M198:O5M-S4WM-KB1 M199:P5M-KB1M-S3 M200:K5M-S3M-KB1 M201:R5M-KB1M-S3 M202:S5M-S4WM-KB1 M203:T5M-KB1M-S3 M204:U5M-KB2 M205:V5M-KB3" },
  { level: 5, tranche: 2, buildingZone: "Market Rate Vertical Wing", layout: "vertical-wing", source: "M328:AA5M-S3M-KB1 M329:AB5M-KB1M-S3 M332:AE5M-S3M-KB1 M333:AF5M-KB1M-S3 M334:AG5M-S4WM-KB1 M335:AH5M-KB1M-S3 M337:AJ5M-S6 M338:AK5M-K7 M339:AL5M-B7 M340:AM5M-KB11 M326:Y5M-KB9M-KB10 M331:AD5M-KB1M-S3 M341:AN5M-S7 M342:AO5M-K7 M343:AP5M-KB4 M327:Z5M-KB10M-KB9 M330:AC5M-S4WM-KB1 M336:AI5M-KB4 M324:W5M-B6 M325:X5M-KB8" },
  { level: 5, tranche: 3, buildingZone: "Affordable West Wing", layout: "west-wing", source: "M448:BD5M-S4W M449:BC5M-KB7 M450:BB5M-S3 M451:BA5M-KB7 M452:AZ5M-KB17W M453:AY5M-KB6W M454:AX5M-KB5W M455:AW5M-KB16W M456:AV5M-KB5W M457:AU5M-KB6W M458:AT5M-KB15W M459:AS5M-L4 M460:AR5M-L3 M461:AQ5M-H1 M462:DB5M-S4W M463:DA5M-K8 M447:BE5M-B5 M446:BF5M-KB13W" },
  { level: 6, tranche: 4, buildingZone: "Market Rate East Edge", layout: "east-edge", source: "M79:CFA6M-H4 M73:CA6M-3RL M74:CB6M-BKS1 M75:CC6M-BKR1 M76:CD6M-1BKL M77:CE6M-BKS3 M78:CF6M-3RR M80:CG6M-2RB2 M81:CH6M-K9 M83:CJ6M-BKR3 M84:CK6M-1BKL M85:CL6M-BKS2 M86:CM6M-3RR1 M82:CI6M-2BKL" },
  { level: 6, tranche: 1, buildingZone: "Market Rate North Wing", layout: "north-wing", source: "M217:L6M-KB1 M206:A6M-K2W M207:B6M-K1W M208:C6M-B2 M209:D6M-B1 M210:E6M-S1M-K3 M211:F6M-B3M-S2 M212:G6M-K4 M213:H6M-K5M-B4 M214:I6M-K6 M215:J6M-B5 M216:K6M-S5 M218:M6M-S3 M219:N6M-KB1 M220:O6M-S4WM-KB1 M221:P6M-KB1M-S3 M222:K6M-S3M-KB1 M223:R6M-KB1M-S3 M224:S6M-S4WM-KB1 M225:T6M-KB1M-S3 M226:U6M-KB2 M227:V6M-KB3" },
  { level: 6, tranche: 2, buildingZone: "Market Rate Vertical Wing", layout: "vertical-wing", source: "M348:AA6M-S3M-KB1 M356:AI6M-KB4 M346:Y6M-KB9M-KB10 M347:Z6M-KB10M-KB9 M350:AC6M-S4WM-KB1 M351:AD6M-KB1M-S3 M352:AE6M-S3M-KB1 M353:AF6M-KB1M-S3 M357:AJ6M-S6 M358:AK6M-K7 M359:AL6M-B7 M360:AM6M-KB11 M349:AB6M-KB1M-S3 M344:W6M-B6 M345:X6M-KB8 M355:AH6M-KB1M-S3 M354:AG6M-S4WM-KB1" },
  { level: 6, tranche: 3, buildingZone: "Affordable West Wing", layout: "west-wing", source: "M466:BD6M-S4W M467:BC6M-KB7 M468:BB6M-S3 M469:BA6M-KB7 M470:AZ6M-KB17W M471:AY6M-KB6W M472:AX6M-KB5W M473:AW6M-KB16W M474:AV6M-KB5W M475:AU6M-KB6W M476:AT6M-KB15W M477:AS6M-KB6W M478:AR6M-KB5W M479:AQ6M-H1 M480:DB6M-S4W M481:DA6M-K8 M465:BE6M-B5 M464:BF6M-KB13W" },
  { level: 7, tranche: 4, buildingZone: "Market Rate East Edge", layout: "east-edge", source: "M93:CFA7M-H4 M87:CA7M-3RL M88:CB7M-BKS1 M90:CD7M-1BKL M91:CE7M-BKS3 M94:CG7M-2RB2 M95:CH7M-K10 M89:CC7M-BKR1 M92:CF7M-3RR" },
  { level: 7, tranche: 1, buildingZone: "Market Rate North Wing", layout: "north-wing", source: "M228:A7M-K2W M229:B7M-K1W M230:C7M-B2 M231:D7M-B1 M232:E7M-S1M-K3 M233:F7M-B3M-S2 M234:G7M-K4 M235:H7M-K5M-B4 M236:I7M-K6 M237:J7M-B5 M238:K7M-S5 M239:L7M-KB1 M240:M7M-S3 M241:N7M-KB1 M242:O7M-S4WM-KB1 M243:P7M-KB1M-S3 M244:K7M-S3M-KB1 M245:R7M-KB1M-S3 M246:S7M-S4WM-KB1 M247:T7M-KB1M-S3 M248:U7M-KB2 M249:V7M-KB3" },
  { level: 7, tranche: 2, buildingZone: "Market Rate Vertical Wing", layout: "vertical-wing", source: "M365:AA7M-S3M-KB1 M373:AI7M-KB4 M363:Y7M-KB9M-KB10 M364:Z7M-KB10M-KB9 M367:AC7M-S4WM-KB1 M368:AD7M-KB1M-S3 M369:AE7M-S3M-KB1 M370:AF7M-KB1M-S3 M374:AJ7M-S6 M375:AK7M-K7 M376:AL7M-B7 M377:AM7M-KB11 M366:AB7M-KB1M-S3 M361:W7M-B6 M362:X7M-KB8 M372:AH7M-KB1M-S3 M371:AG7M-S4WM-KB1" },
  { level: 7, tranche: 3, buildingZone: "Affordable West Wing", layout: "west-wing", source: "M484:BD7M-S4W M485:BC7M-KB7 M486:BB7M-S3 M487:BA7M-KB7 M488:AZ7M-KB17W M489:AY7M-KB6W M490:AX7M-KB5W M491:AW7M-KB16W M492:AV7M-KB5W M493:AU7M-KB6W M494:AT7M-KB15W M495:AS7M-KB6W M496:AR7M-KB5W M497:AQ7M-KB14 M498:DB7M-S4W M499:DB7M-S4W M483:BE7M-B5 M482:BF7M-KB13W" },
];

const southWingExceptionModuleIds = new Set(["M1", "M2"]);

function parseSource(source: string): Array<{ id: string; unitCode: string }> {
  return source.split(" ").map((item) => {
    const [id, unitCode] = item.split(":");
    return { id, unitCode };
  });
}

function positionFor(
  layout: LayoutKind,
  level: number,
  id: string,
  index: number,
): Vector3Tuple {
  const coordinate = moduleCoordinates[id];
  if (coordinate) {
    const registeredRect = registerSheetRect(level, {
      xMin: coordinate.sheetXMin,
      xMax: coordinate.sheetXMax,
      yMin: coordinate.sheetYMin,
      yMax: coordinate.sheetYMax,
    });

    return sheetPointToModelPosition(
      (registeredRect.xMin + registeredRect.xMax) / 2,
      (registeredRect.yMin + registeredRect.yMax) / 2,
      level,
    );
  }

  const y = sheetPointToModelPosition(1360, 1000, level)[1];

  if (layout === "west-wing") {
    return [-5.6 + index * 0.72, y, 1.85];
  }

  if (layout === "east-edge") {
    return [5.35, y, 1.5 - index * 0.66];
  }

  if (layout === "vertical-wing") {
    return [3.6, y, -2.6 + index * 0.58];
  }

  const col = index % 12;
  const row = Math.floor(index / 12);
  return [-4.1 + col * 0.72, y, -3.1 - row * 0.72];
}

function sizeFor(layout: LayoutKind, id: string): Vector3Tuple {
  const coordinate = moduleCoordinates[id];
  if (coordinate) {
    return sheetSizeToModelSize(coordinate.sheetWidth, coordinate.sheetHeight, 0.56);
  }

  if (layout === "vertical-wing" || layout === "east-edge") {
    return [0.46, 0.56, 0.5];
  }

  return [0.46, 0.56, 0.72];
}

function notesFor(id: string): string {
  if (id === "M211") {
    return "Source-derived ID/unit and PDF footprint; M211 corrects a level 6 text-layer OCR omission.";
  }

  return "Source-derived ID/unit, position, and footprint from Module ID PDF.";
}

function zoneForModule(tranche: TrancheId, id: string): BuildingZone {
  if (southWingExceptionModuleIds.has(id) || tranche === 3) {
    return "Market Rate South Wing";
  }

  if (tranche === 4) {
    return "Residential Affordable";
  }

  if (tranche === 2) {
    return "Market Rate East Wing";
  }

  if (tranche === 1 && isEastWestFacingNorthWingModule(id)) {
    return "Market Rate North Wing";
  }

  return "Market Rate West Wing";
}

function isEastWestFacingNorthWingModule(id: string): boolean {
  const coordinate = moduleCoordinates[id];

  return Boolean(coordinate && coordinate.sheetHeight > coordinate.sheetWidth);
}

export const modules: BuildingModule[] = sourceGroups.flatMap((group) =>
  parseSource(group.source).map((module, index) => ({
    ...module,
    level: group.level,
    tranche: group.tranche,
    buildingZone: zoneForModule(group.tranche, module.id),
    position: positionFor(group.layout, group.level, module.id, index),
    size: sizeFor(group.layout, module.id),
    sourcePage: group.level + 1,
    notes: notesFor(module.id),
  })),
);

export const levels = [1, 2, 3, 4, 5, 6, 7];

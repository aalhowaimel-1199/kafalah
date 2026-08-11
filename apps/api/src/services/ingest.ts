import { prisma } from "@ramh/db";
import { floorService } from "./floor.service";
import { movementService } from "./movement.service";

export async function ingestMovement(opts: { visitId: string; doorId?: string; direction?: "IN" | "OUT"; at?: Date }) {
  let direction = opts.direction;
  if (!direction) {
    const last = await prisma.accessMovement.findFirst({ where: { visitId: opts.visitId }, orderBy: { at: "desc" } });
    direction = last?.direction === "IN" ? "OUT" : "IN";
  }
  let gateId: string | null = null;
  let floorKey: string | null = null;
  if (opts.doorId) {
    const gate = await floorService.gateByDoorId(opts.doorId);
    if (gate) {
      gateId = gate.id;
      floorKey = gate.floorKey;
    }
  }
  return movementService.record({ visitId: opts.visitId, gateId, floorKey, direction, source: "biotime" });
}

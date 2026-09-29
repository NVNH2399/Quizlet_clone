import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import WriteExerciseView from "./exercise-view";

export default async function WriteExercisePage({
  params,
}: {
  params: Promise<{ id: string; exerciseId: string }>;
}) {
  const { exerciseId } = await params;

  const exercise = await prisma.writingExercise.findUnique({ where: { id: exerciseId } });
  if (!exercise) notFound();

  return <WriteExerciseView exercise={exercise} />;
}
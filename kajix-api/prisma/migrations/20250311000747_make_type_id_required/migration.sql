/*
  Warnings:

  - Made the column `type_id` on table `llm_models` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "llm_models" DROP CONSTRAINT "llm_models_type_id_fkey";

-- AlterTable
ALTER TABLE "llm_models" ALTER COLUMN "type_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "llm_models" ADD CONSTRAINT "llm_models_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "std_llm_types"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

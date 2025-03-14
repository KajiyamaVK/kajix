-- AlterTable
ALTER TABLE "llm_models" ADD COLUMN     "type_id" INTEGER;

-- CreateTable
CREATE TABLE "std_llm_types" (
    "id" SERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "std_llm_types_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "llm_models" ADD CONSTRAINT "llm_models_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "std_llm_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

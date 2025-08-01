-- CreateTable
CREATE TABLE "Postcode" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "postcode" INTEGER NOT NULL,
    "locality" TEXT NOT NULL,
    "electorate_rating" TEXT NOT NULL,

    CONSTRAINT "Postcode_pkey" PRIMARY KEY ("id")
);

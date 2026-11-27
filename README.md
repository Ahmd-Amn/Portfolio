# Portfolio

A personal portfolio for Amin, with a public site and a private owner dashboard. The owner can publish and arrange projects, experience, skills, education, and certifications; edit profile and contact details; manage a profile photo; and create a tailored PDF CV.

Apply the migrations in `supabase/migrations/` to the Supabase project. Migration `004_public_project_media.sql` lets visitors load cover images referenced by published projects while keeping draft images private. Migration `005_owner_project_upload.sql` allows the owner with MFA to upload project images without a service role key.

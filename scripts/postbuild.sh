# --- 1. rename dist  into __dist to signal that it is not intended for imports
rm -rf ./__dist

mv ./dist ./__dist

# --- 2. prepare root validators dir to enable imports: 'import {} from "@virtuslab/formts/validators"'

mkdir ./validators

# 'dist/esm/index2' is a chunk created for 'src/validators/index.ts'
echo 'export * from "../__dist/esm/index2";' > ./validators/index.js

echo 'export * from "../__dist/validators";' > ./validators/index.d.ts
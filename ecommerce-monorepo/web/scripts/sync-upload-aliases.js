const fs = require('fs');
const path = require('path');

function syncUploadAliases() {
  const root = path.join(__dirname, '..', 'public', 'uploads');
  const dirs = ['products', 'general', 'breadcrumb', 'favicons'];

  console.log('Syncing upload file aliases in:', root);

  let createdAliases = 0;

  for (const dirName of dirs) {
    const dir = path.join(root, dirName);
    if (!fs.existsSync(dir)) continue;

    const files = fs.readdirSync(dir);
    for (const file of files) {
      const match = file.match(/^(\d{13})-(.+)$/);
      if (match) {
        const originalName = match[2];
        const targetPath = path.join(dir, originalName);

        if (!fs.existsSync(targetPath)) {
          fs.copyFileSync(path.join(dir, file), targetPath);
          createdAliases++;
          console.log(`  [${dirName}] Aliased ${file} -> ${originalName}`);
        }
      }
    }
  }

  // Also cross-link products from general to products directory if requested under /uploads/products/
  const generalDir = path.join(root, 'general');
  const productsDir = path.join(root, 'products');

  if (fs.existsSync(generalDir) && fs.existsSync(productsDir)) {
    const generalFiles = fs.readdirSync(generalDir);
    for (const gf of generalFiles) {
      const targetInProducts = path.join(productsDir, gf);
      if (!fs.existsSync(targetInProducts)) {
        fs.copyFileSync(path.join(generalDir, gf), targetInProducts);
        createdAliases++;
        console.log(`  [general->products] Mirrored ${gf}`);
      }
    }
  }

  console.log(`\nSuccessfully created ${createdAliases} alias file(s)!`);
}

syncUploadAliases();

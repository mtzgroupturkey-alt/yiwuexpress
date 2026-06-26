import { PrismaClient, AttributeType } from '@prisma/client'

const prisma = new PrismaClient()

async function seedAttributes() {
  console.log('🌱 Seeding attributes...')

  try {
    // Get categories
    const categories = await prisma.category.findMany({
      where: {
        slug: {
          in: ['clothing', 'electronics', 'cookware', 'furniture', 'home-garden']
        }
      }
    })

    const categoryMap = Object.fromEntries(
      categories.map(cat => [cat.slug, cat.id])
    )

    // Define attribute templates
    const attributeTemplates = [
      // Clothing Attributes
      {
        categorySlug: 'clothing',
        attributes: [
          {
            name: 'Size',
            slug: 'size',
            type: AttributeType.SELECT,
            options: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'],
            placeholder: 'Select size',
            helperText: 'Choose the appropriate size for this garment',
            isRequired: true,
            isFilterable: true,
            isVariant: true,
            displayOrder: 1
          },
          {
            name: 'Color',
            slug: 'color',
            type: AttributeType.COLOR,
            placeholder: '#000000',
            helperText: 'Pick the primary color of the product',
            isRequired: true,
            isFilterable: true,
            isVariant: true,
            displayOrder: 2
          },
          {
            name: 'Material',
            slug: 'material',
            type: AttributeType.SELECT,
            options: ['Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim', 'Leather'],
            placeholder: 'Select material',
            helperText: 'Primary material composition',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 3
          },
          {
            name: 'Brand',
            slug: 'brand',
            type: AttributeType.TEXT,
            placeholder: 'e.g., Nike, Adidas',
            helperText: 'Brand or manufacturer name',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 4
          },
          {
            name: 'Gender',
            slug: 'gender',
            type: AttributeType.SELECT,
            options: ['Men', 'Women', 'Unisex', 'Kids'],
            placeholder: 'Select gender',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 5
          }
        ]
      },
      // Electronics Attributes
      {
        categorySlug: 'electronics',
        attributes: [
          {
            name: 'Voltage',
            slug: 'voltage',
            type: AttributeType.NUMBER,
            placeholder: 'e.g., 220',
            helperText: 'Operating voltage in volts (V)',
            isRequired: true,
            isFilterable: true,
            isVariant: false,
            displayOrder: 1
          },
          {
            name: 'Power',
            slug: 'power',
            type: AttributeType.NUMBER,
            placeholder: 'e.g., 100',
            helperText: 'Power consumption in watts (W)',
            isRequired: true,
            isFilterable: true,
            isVariant: false,
            displayOrder: 2
          },
          {
            name: 'Battery Included',
            slug: 'battery_included',
            type: AttributeType.CHECKBOX,
            helperText: 'Does this product include a battery?',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 3
          },
          {
            name: 'Connectivity',
            slug: 'connectivity',
            type: AttributeType.MULTISELECT,
            options: ['WiFi', 'Bluetooth', 'NFC', 'USB-C', 'HDMI', 'Ethernet'],
            placeholder: 'Select connectivity options',
            helperText: 'Available connectivity features',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 4
          },
          {
            name: 'Weight',
            slug: 'weight_electronics',
            type: AttributeType.NUMBER,
            placeholder: 'e.g., 0.5',
            helperText: 'Product weight in kilograms (kg)',
            isRequired: true,
            isFilterable: false,
            isVariant: false,
            displayOrder: 5
          },
          {
            name: 'Warranty Period',
            slug: 'warranty_period',
            type: AttributeType.SELECT,
            options: ['3 Months', '6 Months', '1 Year', '2 Years', '3 Years', '5 Years'],
            placeholder: 'Select warranty period',
            helperText: 'Manufacturer warranty duration',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 6
          }
        ]
      },
      // Cookware Attributes
      {
        categorySlug: 'cookware',
        attributes: [
          {
            name: 'Material',
            slug: 'cookware_material',
            type: AttributeType.SELECT,
            options: ['Stainless Steel', 'Aluminum', 'Cast Iron', 'Copper', 'Non-Stick Aluminum', 'Ceramic'],
            placeholder: 'Select material',
            helperText: 'Primary construction material',
            isRequired: true,
            isFilterable: true,
            isVariant: false,
            displayOrder: 1
          },
          {
            name: 'Coating',
            slug: 'coating',
            type: AttributeType.SELECT,
            options: ['Non-stick', 'Ceramic', 'Enamel', 'None'],
            placeholder: 'Select coating',
            helperText: 'Interior coating type',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 2
          },
          {
            name: 'Diameter',
            slug: 'diameter',
            type: AttributeType.NUMBER,
            placeholder: 'e.g., 24',
            helperText: 'Diameter in centimeters (cm)',
            isRequired: false,
            isFilterable: true,
            isVariant: true,
            displayOrder: 3
          },
          {
            name: 'Induction Ready',
            slug: 'induction_ready',
            type: AttributeType.CHECKBOX,
            helperText: 'Compatible with induction cooktops?',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 4
          },
          {
            name: 'Dishwasher Safe',
            slug: 'dishwasher_safe',
            type: AttributeType.CHECKBOX,
            helperText: 'Safe for dishwasher cleaning?',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 5
          },
          {
            name: 'Handle Material',
            slug: 'handle_material',
            type: AttributeType.SELECT,
            options: ['Stainless Steel', 'Silicone', 'Bakelite', 'Wood', 'Plastic'],
            placeholder: 'Select handle material',
            isRequired: false,
            isFilterable: false,
            isVariant: false,
            displayOrder: 6
          }
        ]
      },
      // Furniture Attributes
      {
        categorySlug: 'furniture',
        attributes: [
          {
            name: 'Dimensions',
            slug: 'dimensions',
            type: AttributeType.TEXT,
            placeholder: 'e.g., 120x80x75 cm (L x W x H)',
            helperText: 'Overall dimensions in cm',
            isRequired: true,
            isFilterable: false,
            isVariant: false,
            displayOrder: 1
          },
          {
            name: 'Material',
            slug: 'furniture_material',
            type: AttributeType.MULTISELECT,
            options: ['Wood', 'Metal', 'Glass', 'Fabric', 'Leather', 'Plastic', 'Rattan'],
            placeholder: 'Select materials',
            helperText: 'Primary materials used',
            isRequired: true,
            isFilterable: true,
            isVariant: false,
            displayOrder: 2
          },
          {
            name: 'Color',
            slug: 'furniture_color',
            type: AttributeType.COLOR,
            placeholder: '#000000',
            helperText: 'Primary furniture color',
            isRequired: true,
            isFilterable: true,
            isVariant: true,
            displayOrder: 3
          },
          {
            name: 'Assembly Required',
            slug: 'assembly_required',
            type: AttributeType.CHECKBOX,
            helperText: 'Does this furniture require assembly?',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 4
          },
          {
            name: 'Weight Capacity',
            slug: 'weight_capacity',
            type: AttributeType.NUMBER,
            placeholder: 'e.g., 150',
            helperText: 'Maximum weight capacity in kg',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 5
          },
          {
            name: 'Style',
            slug: 'furniture_style',
            type: AttributeType.SELECT,
            options: ['Modern', 'Contemporary', 'Traditional', 'Rustic', 'Industrial', 'Scandinavian', 'Minimalist'],
            placeholder: 'Select style',
            helperText: 'Furniture design style',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 6
          }
        ]
      },
      // Home & Garden Attributes
      {
        categorySlug: 'home-garden',
        attributes: [
          {
            name: 'Indoor/Outdoor',
            slug: 'indoor_outdoor',
            type: AttributeType.SELECT,
            options: ['Indoor Only', 'Outdoor Only', 'Both'],
            placeholder: 'Select usage',
            helperText: 'Where can this product be used?',
            isRequired: true,
            isFilterable: true,
            isVariant: false,
            displayOrder: 1
          },
          {
            name: 'Waterproof',
            slug: 'waterproof',
            type: AttributeType.CHECKBOX,
            helperText: 'Is this product waterproof?',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 2
          },
          {
            name: 'Material',
            slug: 'home_garden_material',
            type: AttributeType.SELECT,
            options: ['Plastic', 'Wood', 'Metal', 'Ceramic', 'Stone', 'Fabric', 'Composite'],
            placeholder: 'Select material',
            isRequired: false,
            isFilterable: true,
            isVariant: false,
            displayOrder: 3
          },
          {
            name: 'Color',
            slug: 'home_garden_color',
            type: AttributeType.COLOR,
            placeholder: '#000000',
            helperText: 'Product color',
            isRequired: false,
            isFilterable: true,
            isVariant: true,
            displayOrder: 4
          }
        ]
      }
    ]

    // Create attributes and link to categories
    let createdCount = 0
    let skippedCount = 0

    for (const template of attributeTemplates) {
      const categoryId = categoryMap[template.categorySlug]
      
      if (!categoryId) {
        console.log(`⚠️  Category '${template.categorySlug}' not found, skipping...`)
        continue
      }

      console.log(`\n📁 Creating attributes for: ${template.categorySlug}`)

      for (const attrData of template.attributes) {
        try {
          // Check if attribute already exists
          const existing = await prisma.attribute.findUnique({
            where: { slug: attrData.slug }
          })

          if (existing) {
            console.log(`   ⏭️  Skipped: ${attrData.name} (already exists)`)
            skippedCount++
            continue
          }

          // Create attribute
          const attribute = await prisma.attribute.create({
            data: {
              name: attrData.name,
              slug: attrData.slug,
              type: attrData.type,
              options: attrData.options || [],
              placeholder: attrData.placeholder,
              helperText: attrData.helperText,
              isRequired: attrData.isRequired,
              isFilterable: attrData.isFilterable,
              isVariant: attrData.isVariant,
              displayOrder: attrData.displayOrder,
              isActive: true
            }
          })

          // Link to category
          await prisma.categoryAttribute.create({
            data: {
              categoryId: categoryId,
              attributeId: attribute.id,
              displayOrder: attrData.displayOrder,
              isVisible: true,
              isRequired: attrData.isRequired
            }
          })

          console.log(`   ✅ Created: ${attrData.name} (${attrData.type})`)
          createdCount++
        } catch (error: any) {
          console.error(`   ❌ Error creating ${attrData.name}:`, error.message)
        }
      }
    }

    console.log(`\n✨ Seeding complete!`)
    console.log(`   📊 Created: ${createdCount} attributes`)
    console.log(`   ⏭️  Skipped: ${skippedCount} attributes`)

    // Show summary
    const summary = await prisma.category.findMany({
      where: {
        slug: {
          in: ['clothing', 'electronics', 'cookware', 'furniture', 'home-garden']
        }
      },
      include: {
        _count: {
          select: {
            attributes: true
          }
        }
      }
    })

    console.log(`\n📋 Summary:`)
    summary.forEach(cat => {
      console.log(`   ${cat.name}: ${cat._count.attributes} attributes`)
    })

  } catch (error) {
    console.error('❌ Error seeding attributes:', error)
    throw error
  }
}

async function main() {
  await seedAttributes()
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

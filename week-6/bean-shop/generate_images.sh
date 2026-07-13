#!/bin/bash
API_KEY="b12d9ab4-4f94-4f2b-b528-d577279ff1fa:4e408c0d4b1791a1a718cccfd6e5b9db"
API_URL="https://fal.run/fal-ai/flux/schnell"

generate() {
  local name="$1"
  local prompt="$2"
  
  echo "Generating: $name..."
  
  RESPONSE=$(curl -s -X POST "$API_URL" \
    -H "Authorization: Key $API_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"prompt\": \"$prompt\",
      \"image_size\": \"landscape_16_9\",
      \"num_images\": 1,
      \"num_inference_steps\": 4
    }")
  
  IMG_URL=$(echo "$RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['images'][0]['url'])" 2>/dev/null)
  
  if [ -n "$IMG_URL" ] && [ "$IMG_URL" != "None" ]; then
    curl -s -o "images/${name}.jpg" "$IMG_URL"
    echo "Done: $name ✓"
  else
    echo "FAILED: $name - $RESPONSE"
  fi
}

# Batch 1 (4 parallel)
generate "hero" "Premium specialty coffee shop interior, warm ambient lighting, coffee beans scattered on wooden counter, espresso machine, cozy atmosphere, professional food photography, cinematic, 4k quality, moody warm tones" &
generate "ethiopia" "Ethiopian Yirgacheffe single origin light roast coffee beans in a small ceramic bowl, jasmine flowers and citrus slices, wooden table, soft natural light, overhead shot, professional food photography, 4k" &
generate "colombia" "Colombian Supremo medium roast coffee beans in a rustic burlap sack, caramel pieces and chocolate nearby, wooden background, warm studio lighting, professional food photography, top-down view, 4k" &
generate "guatemala" "Guatemalan Antigua dark roasted coffee beans in a dark ceramic cup, volcanic rock, dark chocolate pieces, moody dramatic lighting, professional food photography, warm earth tones, 4k" &
wait

# Batch 2 (4 parallel)
generate "kenya" "Kenyan AA medium roast coffee beans in a traditional African bowl, blackcurrant berries and grapefruit slices, natural wood surface, bright natural lighting, professional food photography, vibrant, 4k" &
generate "brazil" "Brazilian Santos dark roast coffee beans in a terracotta bowl, nuts and caramel scattered, rustic wooden table, warm golden light, professional food photography, overhead shot, 4k" &
generate "costarica" "Costa Rica Tarrazu honey processed coffee beans in a glass jar, honey dipper, peach slices, almonds, bright airy setting, natural sunlight, professional food photography, 4k" &
generate "indonesia" "Indonesian Sumatra Mandheling dark roast coffee beans on a banana leaf, herbs and dark chocolate, tropical setting, moody warm lighting, professional food photography, earthy tones, 4k" &
wait

# Batch 3
generate "panama" "Panama Geisha premium specialty coffee beans in an elegant porcelain cup, lavender sprigs, jasmine flowers, luxurious gold accents, soft ethereal lighting, professional food photography, premium aesthetic, 4k" &
wait

echo ""
echo "=== Results ==="
ls -lh images/

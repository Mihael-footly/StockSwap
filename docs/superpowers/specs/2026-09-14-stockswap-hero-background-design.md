# StockSwap Hero Background Design

## Goal

Give the existing StockSwap swap screen a memorable, calm hero atmosphere using the supplied sunrise landscape while keeping the quote and swap controls as the primary action.

## Direction

Use the supplied 2072×759 panoramic image as a full-bleed background layer at the top of the swap page. A layered forest-green gradient keeps the centered cream typography and elevated swap card readable. The image stays visible through the headline and upper card area, then fades into the existing `#08110E` page background so the rest of the workflow remains dense and legible.

## Responsive behavior

- Desktop: background spans the viewport width and anchors the image around its upper center, with the sun remaining visible on the right.
- Mobile: preserve the panoramic mood with a shorter, darker crop and keep the swap card fully opaque for reliable contrast.
- Reduced motion: no background animation; normal motion is limited to a subtle static reveal on the hero layer.

## Implementation boundaries

- Add the supplied image to `public/stockswap-hero.png`.
- Modify only the existing swap page styling in `app/globals.css`; no route, copy, or analytics changes.
- Keep all controls, wallet behavior, and asset metadata unchanged.

## Validation

Run `npm test`, `npm run typecheck`, `npm run build`, and `git diff --check`.

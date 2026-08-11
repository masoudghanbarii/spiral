import React, { useMemo } from "react";
import { Box, Text } from "ink";
import {
  BRAILLE,
  buildSpiralPath,
  buildGridRows,
  buildCoilGrid,
  buildStrip,
  type GridRow,
  type StripCell,
} from "./types.js";

// === Braille Spinner ===

interface BrailleSpinnerProps {
  frame: number;
  color?: string;
  offset?: number;
}

export function BrailleSpinner({
  frame,
  color = "yellow",
  offset = 0,
}: BrailleSpinnerProps): React.ReactElement {
  const idx = (frame + offset) % BRAILLE.length;
  return <Text color={color as any}>{BRAILLE[idx]}</Text>;
}

// === Grid Loader (9x9 spiral) ===

interface GridLoaderProps {
  frame: number;
  size?: number;
}

export function GridLoader({ frame, size = 9 }: GridLoaderProps): React.ReactElement {
  const spiralPath = useMemo(() => buildSpiralPath(size), [size]);
  const rows: GridRow[] = useMemo(
    () => buildGridRows(frame, spiralPath, size),
    [frame, spiralPath, size],
  );

  return (
    <Box flexDirection="column">
      {rows.map((row, ri) => (
        <Box key={ri}>
          {row.cells.map((cell, ci) => (
            <Text key={ci} color={cell.color as any}>
              {cell.ch}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}

// === Coil Loader (spiral with box-drawing chars) ===

interface CoilLoaderProps {
  frame: number;
  size?: number;
}

export function CoilLoader({ frame, size = 9 }: CoilLoaderProps): React.ReactElement {
  const rows: GridRow[] = useMemo(() => buildCoilGrid(size, frame), [frame, size]);

  return (
    <Box flexDirection="column">
      {rows.map((row, ri) => (
        <Box key={ri}>
          {row.cells.map((cell, ci) => (
            <Text key={ci} color={cell.color as any}>
              {cell.ch}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
  );
}

// === Strip Loader (horizontal fading dots) ===

interface StripLoaderProps {
  frame: number;
  width?: number;
  color?: string;
}

export function StripLoader({
  frame,
  width = 48,
  color = "yellow",
}: StripLoaderProps): React.ReactElement {
  const cells: StripCell[] = useMemo(() => buildStrip(width, color, frame), [frame, width, color]);

  return (
    <Box>
      {cells.map((cell, i) => (
        <Text key={i} color={cell.color as any}>
          {cell.ch}
        </Text>
      ))}
    </Box>
  );
}

// === Combined Loader (auto-selects style) ===

interface LoaderProps {
  style: "grid" | "coil";
  frame: number;
  size?: number;
}

export function Loader({ style, frame, size = 9 }: LoaderProps): React.ReactElement {
  if (style === "coil") {
    return <CoilLoader frame={frame} size={size} />;
  }
  return <GridLoader frame={frame} size={size} />;
}

export default Loader;

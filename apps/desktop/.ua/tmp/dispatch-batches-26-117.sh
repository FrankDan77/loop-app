#!/bin/bash
# Dispatch remaining 92 batches in groups of 20 for efficient parallelization
for start in 26 46 66 86 106; do
  end=$((start + 19))
  [ $end -gt 117 ] && end=117
  echo "Batches $start-$end"
done

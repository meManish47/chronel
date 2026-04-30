import re
from typing import List


def recursive_split(text: str, chunk_size: int, separators: List[str]) -> List[str]:
    if len(text) <= chunk_size:
        return [text]

    for sep in separators:
        if sep == "":
            break

        parts = text.split(sep)

        chunks = []
        current = ""

        for part in parts:
            candidate = current + (sep if current else "") + part

            if len(candidate) <= chunk_size:
                current = candidate
            else:
                if current:
                    chunks.append(current)
                current = part

        if current:
            chunks.append(current)

        # If splitting worked, recurse further
        if len(chunks) > 1:
            final_chunks = []
            for chunk in chunks:
                final_chunks.extend(
                    recursive_split(chunk, chunk_size, separators[1:])
                )
            return final_chunks

    # fallback: hard split
    return [text[i:i+chunk_size] for i in range(0, len(text), chunk_size)]


def chunk_text(text: str):
    separators = ["\n\n", "\n", ". ", " ", ""]
    
    base_chunks = recursive_split(text, 800, separators)

    # add overlap
    final_chunks = []
    overlap = 100

    for i, chunk in enumerate(base_chunks):
        if i == 0:
            final_chunks.append(chunk)
        else:
            prev = final_chunks[-1]
            combined = prev[-overlap:] + " " + chunk
            final_chunks.append(combined)

    return final_chunks
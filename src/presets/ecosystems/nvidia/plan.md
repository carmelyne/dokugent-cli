# NVIDIA-Style Plan

1. Extract audio from input video
2. Transcribe using Whisper or equivalent
3. Sample keyframes every 5 seconds
4. Run vision model on frames (e.g., Owl-ViT)
5. Summarize outputs using Graph-RAG

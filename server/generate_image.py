import sys
import torch
from diffusers import StableDiffusionPipeline
import base64
from io import BytesIO

# Load the model from Hugging Face online
model_id = "sd-legacy/stable-diffusion-v1-5"
pipe = StableDiffusionPipeline.from_pretrained(model_id, torch_dtype=torch.float16)
pipe = pipe.to("cuda" if torch.cuda.is_available() else "cpu")  # Use GPU if available, else CPU

def generate_image(prompt):
    # Generate the image
    image = pipe(prompt, num_inference_steps=50).images[0]
    
    # Convert to base64
    buffered = BytesIO()
    image.save(buffered, format="PNG")
    img_str = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return f"data:image/png;base64,{img_str}"

if __name__ == "__main__":
    # Accept prompt from command line
    if len(sys.argv) < 2:
        print("Error: Please provide a prompt")
        sys.exit(1)
    prompt = sys.argv[1]
    image_url = generate_image(prompt)
    print(image_url)  # Output base64 string to stdout
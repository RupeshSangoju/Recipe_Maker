from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.chrome.options import Options
from webdriver_manager.chrome import ChromeDriverManager
import requests
from PIL import Image, ImageEnhance
from io import BytesIO
import time
import sys
import os

def get_first_image_google(dish_name):
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')

    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    url = f"https://www.google.com/search?hl=en&tbm=isch&q={dish_name}"
    driver.get(url)
    time.sleep(2)

    body = driver.find_element(By.TAG_NAME, "body")
    for _ in range(3):
        body.send_keys(Keys.PAGE_DOWN)
        time.sleep(1)

    image_url = None
    try:
        images = driver.find_elements(By.TAG_NAME, 'img')
        for img in images:
            src = img.get_attribute('src')
            if src and not src.startswith('data:image'):
                image_url = src
                print(f"Image URL: {image_url}")
                break
        if not image_url:
            print("No image found.")
    except Exception as e:
        print(f"Error: {e}")
    driver.quit()
    return image_url

def enhance_image_from_url(image_url, output_path, scale_factor=2, sharpness_factor=2.0):
    if not image_url:
        print("No image URL provided for enhancement.")
        return False

    response = requests.get(image_url)
    if response.status_code == 200:
        image = Image.open(BytesIO(response.content))
        new_width = int(image.width * scale_factor)
        new_height = int(image.height * scale_factor)
        resized_image = image.resize((new_width, new_height), Image.Resampling.LANCZOS)
        enhancer = ImageEnhance.Sharpness(resized_image)
        enhanced_image = enhancer.enhance(sharpness_factor)
        enhanced_image.save(output_path)
        print(f"Enhanced image saved at {output_path}")
        return True
    else:
        print(f"Failed to download the image. Status code: {response.status_code}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python image_generator.py <dish_name> <output_path>")
        sys.exit(1)
    dish_name = sys.argv[1]
    output_path = sys.argv[2]
    image_url = get_first_image_google(dish_name)
    if image_url:
        enhance_image_from_url(image_url, output_path)
    else:
        print("Failed to retrieve image URL.")
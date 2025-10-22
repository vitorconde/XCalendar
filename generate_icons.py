from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, text, bg_color, text_color):
    # Criar uma nova imagem com fundo transparente
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Desenhar um círculo como fundo
    circle_bbox = [(2, 2), (size-2, size-2)]
    draw.ellipse(circle_bbox, fill=bg_color, outline=(200, 200, 200, 255), width=1)
    
    # Adicionar texto (apenas para ícones maiores)
    if size >= 48:
        try:
            # Tente carregar uma fonte, caso contrário use a fonte padrão
            font_size = size // 2
            try:
                font = ImageFont.truetype("arial.ttf", font_size)
            except IOError:
                font = ImageFont.load_default()
            
            # Calcular posição do texto
            text_bbox = draw.textbbox((0, 0), text, font=font)
            text_width = text_bbox[2] - text_bbox[0]
            text_height = text_bbox[3] - text_bbox[1]
            position = ((size - text_width) // 2, (size - text_height) // 2 - size//10)
            
            # Desenhar o texto
            draw.text(position, text, font=font, fill=text_color)
        except Exception as e:
            print(f"Erro ao adicionar texto ao ícone {size}x{size}: {e}")
    
    return img

def main():
    # Cores do tema
    bg_color = (74, 111, 165, 255)  # Azul principal
    text_color = (255, 255, 255, 255)  # Branco
    
    # Tamanhos de ícone necessários
    sizes = [16, 32, 48, 64, 128, 256]
    
    # Criar diretório de ícones se não existir
    if not os.path.exists('icons'):
        os.makedirs('icons')
    
    # Gerar ícones
    for size in sizes:
        # Texto para ícones maiores
        text = 'XC' if size >= 32 else ''
        
        # Criar e salvar o ícone
        icon = create_icon(size, text, bg_color, text_color)
        icon_path = f'icons/icon{size}.png'
        icon.save(icon_path, 'PNG')
        print(f'Ícone criado: {icon_path}')
    
    print('\nÍcones gerados com sucesso!')

if __name__ == '__main__':
    main()

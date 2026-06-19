import re

def validar_cadena(valor: str) -> str:
    """
    Valida que la cadena contenga únicamente letras o caracteres especiales 
    (espacios, guiones, símbolos, etc.), pero no sea solo números.

    Args:
        valor (str): La cadena a validar.

    Returns:
        str: La cadena normalizada (strip).

    Raises:
        ValueError: Si la cadena es inválida.
    """
    if not isinstance(valor, str):
        raise ValueError("El valor debe ser una cadena de caracteres.")

    valor = valor.strip()
    if not valor:
        raise ValueError("La cadena no puede estar vacía.")

    # Rechazar si es solo números
    if valor.isdigit():
        raise ValueError("La cadena no puede ser solo números.")

    # Validar que solo tenga letras o caracteres especiales permitidos
    # Permitimos letras, espacios y símbolos comunes
    patron = r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s\-\_\.\,\!\?\@\#\$\%\&\(\)\[\]\{\}]+$'
    if not re.match(patron, valor):
        raise ValueError("La cadena contiene caracteres no permitidos.")

    return valor
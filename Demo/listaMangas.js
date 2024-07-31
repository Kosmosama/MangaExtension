// La lista empieza vacia realmente, ésto es una prueba hasta que tengamos hecha la carga desde json
let mangas = [];

// Muestra todos los mangas de la lista en un div (Sin el formato que queremos actualmente)
function cargarListaMangas() {
    const listaMangasDiv = document.getElementById("lista-mangas");
    listaMangasDiv.innerHTML = "";

    mangas.forEach((manga, index) => {
        const mangaDiv = document.createElement("div");

        const nombre = document.createElement("h1");
        nombre.textContent = manga.nombre;
        mangaDiv.appendChild(nombre);

        const link = document.createElement("p");
        link.textContent = `Link: ${manga.link}`;
        mangaDiv.appendChild(link);

        const linkImagen = document.createElement("p");
        linkImagen.textContent = `Link Imagen: ${manga.linkImagen}`;
        mangaDiv.appendChild(linkImagen);

        const numCapitulos = document.createElement("p");
        numCapitulos.textContent = `Número de Capítulos: ${manga.numCapitulos}`;
        mangaDiv.appendChild(numCapitulos);

        if (manga.favorito) {
            const favorito = document.createElement("p");
            favorito.textContent = "Favorito";
            mangaDiv.appendChild(favorito);
        }

        const botonFavorito = document.createElement("button");
        botonFavorito.textContent = "Alternar Favorito";
        botonFavorito.onclick = () => alternarFavorito(index);
        mangaDiv.appendChild(botonFavorito);

        const botonEliminar = document.createElement("button");
        botonEliminar.textContent = "Eliminar Manga";
        botonEliminar.onclick = () => eliminarManga(index);
        mangaDiv.appendChild(botonEliminar);

        const botonEditar = document.createElement("button");
        botonEditar.textContent = "Editar Manga";
        botonEditar.onclick = () => abrirFormularioEdicion(index);
        mangaDiv.appendChild(botonEditar);

        listaMangasDiv.appendChild(mangaDiv);
    });
}

document.addEventListener("DOMContentLoaded", cargarListaMangas);
const cookbookHtml = {};

// This is a mess. The assembler needs to be reworked to that it sucks less.

class htmlAssembler {
    constructor() {
        this.text = '';
    }

    generic(tag, inner) {
        this.text += '<' + tag + '>' + inner + '</' + tag + '>';
        return this;
    }

    div(inner, id = '', cssClass = '', onclick = '') {
        this.text +=
            '<div id="' +
            id +
            '" class="' +
            cssClass +
            '" onclick="' +
            onclick +
            '" >' +
            inner +
            '</div>';
        return this;
    }

    section(inner, id = '', cssClass = '') {
        this.text +=
            '<section id=' +
            id +
            'class=' +
            cssClass +
            '>' +
            inner +
            '</section>';
        return this;
    }

    ul(inner, id = '', cssClass = '') {
        this.text +=
            '<ul id="' + id + '" class="' + cssClass + '" >' + inner + '</ul>';
        return this;
    }

    li(inner, id = '', cssClass = '') {
        this.text +=
            '<li id="' + id + '" class="' + cssClass + '" >' + inner + '</ul>';
        return this;
    }

    img(src, alt) {
        this.text += '<img src="' + src + '" alt="' + alt + '" >';
        return this;
    }

    h1(inner, id = '', cssClass = '') {
        this.text +=
            '<h1 id="' + id + '" class="' + cssClass + '" >' + inner + '</h1>';
        return this;
    }

    h2(inner, id = '', cssClass = '') {
        this.text +=
            '<h2 id="' + id + '" class="' + cssClass + '" >' + inner + '</h2>';
        return this;
    }

    h3(inner, id = '', cssClass = '') {
        this.text +=
            '<h3 id="' + id + '" class="' + cssClass + '" >' + inner + '</h3>';
        return this;
    }

    getText() {
        return this.text;
    }
}

cookbookHtml.generateGrid = (json) => {
    const cardContainer = new htmlAssembler();
    const cardRows = new htmlAssembler();

    const redirect = () => {
        window.location.href = 'https://';
    };

    const cards = () => {
        let cardsText = '';
        json.forEach((recipe) => {
            // Should not have to make this many objects... Update the assembler later.
            const cardCol = new htmlAssembler();
            const cardBody = new htmlAssembler();
            const cardInner = new htmlAssembler();
            const card = new htmlAssembler();

            cardCol.div(
                card.div(
                    cardBody
                        .img(
                            recipe.imageUrl,
                            'Image of ' + recipe.title,
                            (id = ''),
                            (cssClass = 'card-img-top')
                        )
                        .div(
                            cardInner
                                .h2(
                                    recipe.title,
                                    (id = ''),
                                    (cssClass = 'card-title')
                                )
                                .h3(
                                    recipe.author,
                                    (id = ''),
                                    (cssClass = 'card-subtitle')
                                )
                                .getText(),
                            (cssClass = 'card-body'),
                            (id = '')
                        )

                        .getText(),
                    (id = ''),
                    (cssClass = 'card recipe-card'),
                    (onclick = console.log('Clicked!'))
                ),
                (id = ''),
                (cssClass = 'col')
            );
            cardsText += card.text;
        });
        return cardsText;
    };

    cardContainer.div(
        (inner = cardRows.div(
            (inner = cards()),
            (id = ''),
            (cssClass =
                'row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4')
        )).getText(),
        (id = ''),
        (cssClass = 'container')
    );

    return cardContainer.getText();
};

cookbookHtml.generateRecipePage = (json) => {
    return;
};

module.exports = cookbookHtml;

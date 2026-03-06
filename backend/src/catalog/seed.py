"""Seed catalog with initial TCGs and sample cards."""
from datetime import date
from sqlalchemy.orm import Session

from src.models.tcg import TCG, CardSet, Card, CardVariant


def seed_catalog(db: Session) -> None:
    """Populate catalog with Magic and Pokémon sample data."""
    if db.query(TCG).first():
        return  # Already seeded

    # Magic: The Gathering
    mtg = TCG(slug="magic", name="Magic: The Gathering", supported_regions=["US", "BR"])
    db.add(mtg)
    db.flush()

    dominaria = CardSet(
        tcg_id=mtg.id,
        slug="dom",
        name="Dominaria",
        release_date=date(2018, 4, 27),
    )
    db.add(dominaria)
    db.flush()

    # Sample Magic cards
    for name, number, rarity in [
        ("Lightning Bolt", "150", "Common"),
        ("Llanowar Elves", "168", "Common"),
        ("Teferi, Hero of Dominaria", "207", "Mythic Rare"),
    ]:
        card = Card(
            card_set_id=dominaria.id,
            name=name,
            number=number,
            rarity=rarity,
        )
        db.add(card)
        db.flush()
        db.add_all([CardVariant(card_id=card.id, sku="nonfoil"), CardVariant(card_id=card.id, sku="foil")])

    # Pokémon
    pokemon = TCG(slug="pokemon", name="Pokémon TCG", supported_regions=["US", "BR"])
    db.add(pokemon)
    db.flush()

    base_set = CardSet(
        tcg_id=pokemon.id,
        slug="base1",
        name="Base Set",
        release_date=date(1999, 1, 9),
    )
    db.add(base_set)
    db.flush()

    for name, number, rarity in [
        ("Charizard", "4", "Rare Holo"),
        ("Pikachu", "58", "Common"),
        ("Blastoise", "2", "Rare Holo"),
    ]:
        card = Card(
            card_set_id=base_set.id,
            name=name,
            number=number,
            rarity=rarity,
        )
        db.add(card)
        db.flush()
        db.add(CardVariant(card_id=card.id, sku="normal"))
        db.add(CardVariant(card_id=card.id, sku="holo"))

    db.commit()

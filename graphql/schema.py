import typing
import strawberry


@strawberry.type
class Song:
    title: str
    artist: str

def get_songs():
    return [
        Song(
            title="Example Song",
            artist="Example Artist",
        ),
    ]

@strawberry.type
class Query:
    songs: typing.List[Song] = strawberry.field(resolver=get_songs)

schema = strawberry.Schema(query=Query)
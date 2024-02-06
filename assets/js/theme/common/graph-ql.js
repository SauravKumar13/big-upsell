export default function (auth, query, callback) {
    fetch('/graphql', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${auth}`,
        },
        body: JSON.stringify({
            query,
        }),
    })
        .then((res) => {
            callback(res.json());
        });
}